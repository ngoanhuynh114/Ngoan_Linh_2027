/**
 * ============================================================================
 * GOOGLE APPS SCRIPT BACKEND: NHẬT KÝ MẸ & BÉ
 * ============================================================================
 * Chức năng:
 * 1. Lưu trữ nhật ký, cột mốc của bé vào Google Sheets.
 * 2. Nhận upload ảnh/video (Base64) từ web app và lưu trữ trực tiếp vào Google Drive.
 * 3. Tự động cấp quyền xem công khai (Anyone with link) cho file media.
 * 4. Cung cấp RESTful API (doGet, doPost) hỗ trợ CORS cho ứng dụng Web SPA.
 * ============================================================================
 */

// CẤU HÌNH MẶC ĐỊNH (Bạn có thể điền ID thư mục Google Drive của bạn vào đây)
// Nếu để trống (""), hệ thống sẽ tự động tạo thư mục "NhatKyMeVaBe_Media" trên Drive của bạn!
var DRIVE_FOLDER_ID = ""; 

// Tên trang tính trong Google Sheet
var SHEET_NAME = "NhatKy";

var PROFILE_SHEET_NAME = "CauHinh";

// ===== MẬT KHẨU QUẢN TRỊ (lưu dạng băm trong Script Properties, không trả về trình duyệt) =====
var DEFAULT_ADMIN_PASSWORD = "123";   // Chỉ dùng cho tới khi bạn đổi mật khẩu lần đầu
var MAX_FAILED_LOGINS = 5;            // Sai quá số lần này sẽ bị khóa tạm thời
var LOCK_SECONDS = 600;               // Thời gian khóa: 10 phút

function hashPassword_(salt, password) {
  var bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    salt + ":" + password,
    Utilities.Charset.UTF_8
  );
  return bytes.map(function (b) {
    var v = (b < 0 ? b + 256 : b).toString(16);
    return v.length === 1 ? "0" + v : v;
  }).join("");
}

function isDefaultPassword_() {
  return !PropertiesService.getScriptProperties().getProperty("ADMIN_PASS_HASH");
}

function checkAdminPassword_(password) {
  var props = PropertiesService.getScriptProperties();
  var hash = props.getProperty("ADMIN_PASS_HASH");
  var salt = props.getProperty("ADMIN_PASS_SALT");
  var input = String(password || "");
  if (!hash || !salt) return input === DEFAULT_ADMIN_PASSWORD;
  return hashPassword_(salt, input) === hash;
}

function setAdminPassword_(newPassword) {
  var salt = Utilities.getUuid();
  PropertiesService.getScriptProperties().setProperties({
    ADMIN_PASS_SALT: salt,
    ADMIN_PASS_HASH: hashPassword_(salt, String(newPassword))
  });
}

// Kiểm tra mật khẩu, có giới hạn số lần nhập sai
function authorize_(password) {
  var cache = CacheService.getScriptCache();
  var fails = Number(cache.get("admin_fails") || 0);
  if (fails >= MAX_FAILED_LOGINS) return { ok: false, locked: true };
  if (checkAdminPassword_(password)) {
    cache.remove("admin_fails");
    return { ok: true };
  }
  cache.put("admin_fails", String(fails + 1), LOCK_SECONDS);
  return { ok: false, locked: false };
}

function unauthorizedResponse_(auth) {
  return createJsonResponse({
    status: "error",
    code: auth.locked ? "locked" : "unauthorized",
    message: auth.locked
      ? "Nhập sai quá nhiều lần. Vui lòng thử lại sau 10 phút."
      : "Mật khẩu quản trị không chính xác."
  });
}

// Chạy THỦ CÔNG trong trình soạn thảo Apps Script nếu quên mật khẩu (đưa về mặc định 123)
function resetAdminPassword() {
  var props = PropertiesService.getScriptProperties();
  props.deleteProperty("ADMIN_PASS_HASH");
  props.deleteProperty("ADMIN_PASS_SALT");
  CacheService.getScriptCache().remove("admin_fails");
}

// Danh sách tiêu đề các cột trong Google Sheet
var SHEET_HEADERS = [
  "ID",
  "Ngày",
  "Tiêu đề",
  "Nội dung",
  "Giai đoạn",
  "Cột mốc / Tuần tuổi",
  "Loại media",
  "Media URL",
  "Google Drive File ID",
  "Ngày tạo",
  "Cảm xúc"
];

/**
 * Khởi tạo hoặc lấy Sheet nhật ký, tự động thêm hàng tiêu đề nếu trang tính mới
 */
function getOrCreateSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(SHEET_HEADERS);
    sheet.getRange(1, 1, 1, SHEET_HEADERS.length)
      .setBackground("#FCE7F3")
      .setFontWeight("bold")
      .setFontColor("#9D174D");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/**
 * Khởi tạo hoặc lấy Sheet cấu hình hồ sơ bé
 */
function getOrCreateProfileSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(PROFILE_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(PROFILE_SHEET_NAME);
    sheet.appendRow(["Thuộc tính", "Giá trị"]);
    sheet.getRange(1, 1, 1, 2)
      .setBackground("#FCE7F3")
      .setFontWeight("bold")
      .setFontColor("#9D174D");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/**
 * Đọc thông tin hồ sơ bé từ Google Sheets
 */
function getProfileData() {
  try {
    var sheet = getOrCreateProfileSheet();
    var data = sheet.getDataRange().getValues();
    var profile = {};
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] && String(data[i][0]) !== "adminPassword") {
        profile[String(data[i][0])] = String(data[i][1] || "");
      }
    }
    return profile;
  } catch (err) {
    Logger.log("Lỗi đọc profile: " + err);
    return {};
  }
}

/**
 * Lưu thông tin hồ sơ bé vào Google Sheets
 */
function saveProfileData(profileObj) {
  var sheet = getOrCreateProfileSheet();
  var existingData = sheet.getDataRange().getValues();
  var rowMap = {};
  for (var i = 1; i < existingData.length; i++) {
    rowMap[String(existingData[i][0])] = i + 1;
  }

  var keys = ["nickname", "parentNames", "birthDate", "avatar"];
  for (var k = 0; k < keys.length; k++) {
    var key = keys[k];
    if (profileObj[key] !== undefined && profileObj[key] !== null) {
      if (rowMap[key]) {
        sheet.getRange(rowMap[key], 2).setValue(String(profileObj[key]));
      } else {
        sheet.appendRow([key, String(profileObj[key])]);
        rowMap[key] = sheet.getLastRow();
      }
    }
  }
  return getProfileData();
}

/**
 * Lấy hoặc tạo thư mục lưu trữ ảnh/video trên Google Drive
 */
function getOrCreateFolder() {
  if (DRIVE_FOLDER_ID && DRIVE_FOLDER_ID.trim() !== "") {
    try {
      return DriveApp.getFolderById(DRIVE_FOLDER_ID.trim());
    } catch (err) {
      Logger.log("Không tìm thấy folder theo ID, tạo folder mới: " + err);
    }
  }
  
  var folderName = "NhatKyMeVaBe_Media";
  var folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  }
  var newFolder = DriveApp.createFolder(folderName);
  newFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return newFolder;
}

/**
 * API GET: Lấy danh sách bài viết hoặc kiểm tra kết nối
 */
function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "getMemories";
  
  try {
    if (action === "ping") {
      return createJsonResponse({
        status: "success",
        message: "Google Apps Script Backend hoạt động tốt!",
        time: new Date().toISOString()
      });
    }

    if (action === "getMemories" || action === "getAllData") {
      var sheet = getOrCreateSheet();
      var data = sheet.getDataRange().getValues();
      var memories = [];
      
      // Nếu có dữ liệu bài viết (từ dòng 2 trở đi)
      if (data.length > 1) {
        for (var i = 1; i < data.length; i++) {
          var row = data[i];
          if (!row[0]) continue; // Bỏ qua dòng trống

          var emotionsArr = [];
          if (row[10]) {
            try {
              emotionsArr = typeof row[10] === "string" ? row[10].split(",").map(function(s){ return s.trim(); }) : [String(row[10])];
            } catch(e){}
          }

          memories.push({
            id: String(row[0]),
            date: formatDateString(row[1]),
            title: String(row[2] || ""),
            content: String(row[3] || ""),
            stage: String(row[4] || "daily"),
            milestoneTag: String(row[5] || ""),
            weekOrAge: String(row[5] || ""),
            mediaType: String(row[6] || "none"),
            mediaUrl: String(row[7] || ""),
            driveFileId: String(row[8] || ""),
            createdAt: String(row[9] || ""),
            emotions: emotionsArr
          });
        }

        // Sắp xếp bài mới nhất lên đầu theo ngày
        memories.sort(function(a, b) {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        });
      }

      var profileData = getProfileData();

      return createJsonResponse({
        status: "success",
        data: memories,
        profile: profileData
      });
    }

    if (action === "getProfile") {
      return createJsonResponse({
        status: "success",
        profile: getProfileData()
      });
    }

    return createJsonResponse({
      status: "error",
      message: "Yêu cầu không hợp lệ. Action hỗ trợ: ping, getMemories"
    });

  } catch (error) {
    return createJsonResponse({
      status: "error",
      message: "Lỗi xử lý doGet: " + error.toString()
    });
  }
}

/**
 * API POST: Tạo mới bài viết, tải ảnh/video lên Google Drive và ghi vào Sheet
 */
function doPost(e) {
  try {
    var requestData = {};
    if (e.postData && e.postData.contents) {
      requestData = JSON.parse(e.postData.contents);
    } else {
      requestData = e.parameter || {};
    }

    var action = requestData.action || "createMemory";

    // A. ĐĂNG NHẬP QUẢN TRỊ (kiểm tra mật khẩu ngay trên máy chủ)
    if (action === "verifyAdmin") {
      var authLogin = authorize_(requestData.adminPassword);
      if (!authLogin.ok) return unauthorizedResponse_(authLogin);
      return createJsonResponse({ status: "success", isDefaultPassword: isDefaultPassword_() });
    }

    // B. ĐỔI MẬT KHẨU QUẢN TRỊ
    if (action === "changeAdminPassword") {
      var authChange = authorize_(requestData.currentPassword);
      if (!authChange.ok) return unauthorizedResponse_(authChange);
      var newPass = String(requestData.newPassword || "").trim();
      if (newPass.length < 4) {
        return createJsonResponse({ status: "error", message: "Mật khẩu mới phải có ít nhất 4 ký tự!" });
      }
      setAdminPassword_(newPass);
      return createJsonResponse({ status: "success", message: "Đã đổi mật khẩu quản trị thành công!" });
    }

    // C. MỌI THAO TÁC GHI DỮ LIỆU ĐỀU PHẢI CÓ MẬT KHẨU QUẢN TRỊ
    var writeActions = ["saveProfile", "createMemory", "updateMemory", "deleteMemory"];
    if (writeActions.indexOf(action) !== -1) {
      var authWrite = authorize_(requestData.adminPassword);
      if (!authWrite.ok) return unauthorizedResponse_(authWrite);
    }

    // 0. LƯU CẤU HÌNH HỒ SƠ BÉ VÀO GOOGLE SHEETS
    if (action === "saveProfile") {
      var profileData = requestData.profile || requestData;
      var saved = saveProfileData(profileData);
      return createJsonResponse({
        status: "success",
        message: "Đã lưu hồ sơ bé lên Google Sheets thành công!",
        profile: saved
      });
    }

    // 1. TẠO MỚI KỶ NIỆM (KÈM UPLOAD FILE HOẶC DÙNG LINK CÓ SẴN)
    if (action === "createMemory") {
      var sheet = getOrCreateSheet();
      var id = "mem_" + new Date().getTime() + "_" + Math.floor(Math.random() * 1000);
      var nowIso = new Date().toISOString();

      var date = requestData.date || nowIso.split("T")[0];
      var title = requestData.title || "Kỷ niệm của bé";
      var content = requestData.content || "";
      var stage = requestData.stage || "daily";
      var milestoneTag = requestData.milestoneTag || requestData.weekOrAge || "";
      var mediaType = requestData.mediaType || "none";
      var mediaUrl = requestData.mediaUrl || "";
      var driveFileId = "";
      var emotions = Array.isArray(requestData.emotions) ? requestData.emotions.join(", ") : (requestData.emotions || "");

      // Xử lý upload file Base64 lên Google Drive nếu có
      if (requestData.fileBase64 && requestData.fileName) {
        var folder = getOrCreateFolder();
        var rawData = requestData.fileBase64;
        
        // Loại bỏ phần prefix Data URL nếu có (data:image/jpeg;base64,...)
        if (rawData.indexOf("base64,") !== -1) {
          rawData = rawData.split("base64,")[1];
        }

        var decodedData = Utilities.base64Decode(rawData);
        var mimeType = requestData.mimeType || "image/jpeg";
        var fileName = "BabyMemory_" + date + "_" + requestData.fileName;
        var blob = Utilities.newBlob(decodedData, mimeType, fileName);

        var file = folder.createFile(blob);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

        driveFileId = file.getId();
        mediaUrl = "https://lh3.googleusercontent.com/d/" + driveFileId;
        mediaType = mimeType.indexOf("video") !== -1 ? "video" : "image";
      }

      // Ghi dòng mới vào Sheet
      sheet.appendRow([
        id,
        date,
        title,
        content,
        stage,
        milestoneTag,
        mediaType,
        mediaUrl,
        driveFileId,
        nowIso,
        emotions
      ]);

      return createJsonResponse({
        status: "success",
        message: "Đã lưu kỷ niệm thành công!",
        newMemory: {
          id: id,
          date: date,
          title: title,
          content: content,
          stage: stage,
          milestoneTag: milestoneTag,
          weekOrAge: milestoneTag,
          mediaType: mediaType,
          mediaUrl: mediaUrl,
          driveFileId: driveFileId,
          createdAt: nowIso,
          emotions: requestData.emotions || []
        }
      });
    }

    // 2. CẬP NHẬT KỶ NIỆM
    if (action === "updateMemory") {
      var sheet = getOrCreateSheet();
      var data = sheet.getDataRange().getValues();
      var targetId = requestData.id;
      var foundRow = -1;

      for (var i = 1; i < data.length; i++) {
        if (String(data[i][0]) === String(targetId)) {
          foundRow = i + 1; // Hàng thực tế trong sheet (1-based index)
          break;
        }
      }

      if (foundRow === -1) {
        return createJsonResponse({ status: "error", message: "Không tìm thấy kỷ niệm để cập nhật." });
      }

      // Xử lý upload ảnh mới nếu có
      var driveFileId = data[foundRow - 1][8] || "";
      var mediaUrl = requestData.mediaUrl || data[foundRow - 1][7] || "";
      var mediaType = requestData.mediaType || data[foundRow - 1][6] || "none";

      if (requestData.fileBase64 && requestData.fileName) {
        var folder = getOrCreateFolder();
        var rawData = requestData.fileBase64;
        if (rawData.indexOf("base64,") !== -1) {
          rawData = rawData.split("base64,")[1];
        }
        var decodedData = Utilities.base64Decode(rawData);
        var mimeType = requestData.mimeType || "image/jpeg";
        var fileName = "BabyMemory_" + (requestData.date || "updated") + "_" + requestData.fileName;
        var blob = Utilities.newBlob(decodedData, mimeType, fileName);
        var file = folder.createFile(blob);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

        driveFileId = file.getId();
        mediaUrl = "https://lh3.googleusercontent.com/d/" + driveFileId;
        mediaType = mimeType.indexOf("video") !== -1 ? "video" : "image";
      }

      var emotions = Array.isArray(requestData.emotions) ? requestData.emotions.join(", ") : (requestData.emotions || "");
      var milestoneTag = requestData.milestoneTag || requestData.weekOrAge || "";

      // Cập nhật giá trị các cột
      sheet.getRange(foundRow, 2).setValue(requestData.date || data[foundRow - 1][1]);
      sheet.getRange(foundRow, 3).setValue(requestData.title || data[foundRow - 1][2]);
      sheet.getRange(foundRow, 4).setValue(requestData.content || data[foundRow - 1][3]);
      sheet.getRange(foundRow, 5).setValue(requestData.stage || data[foundRow - 1][4]);
      sheet.getRange(foundRow, 6).setValue(milestoneTag || data[foundRow - 1][5]);
      sheet.getRange(foundRow, 7).setValue(mediaType);
      sheet.getRange(foundRow, 8).setValue(mediaUrl);
      sheet.getRange(foundRow, 9).setValue(driveFileId);
      sheet.getRange(foundRow, 11).setValue(emotions);

      return createJsonResponse({
        status: "success",
        message: "Cập nhật kỷ niệm thành công!",
        updatedId: targetId
      });
    }

    // 3. XÓA KỶ NIỆM
    if (action === "deleteMemory") {
      var sheet = getOrCreateSheet();
      var data = sheet.getDataRange().getValues();
      var targetId = requestData.id;
      var foundRow = -1;
      var fileIdToDelete = "";

      for (var i = 1; i < data.length; i++) {
        if (String(data[i][0]) === String(targetId)) {
          foundRow = i + 1;
          fileIdToDelete = data[i][8];
          break;
        }
      }

      if (foundRow === -1) {
        return createJsonResponse({ status: "error", message: "Không tìm thấy kỷ niệm để xóa." });
      }

      sheet.deleteRow(foundRow);

      // Thử đưa file trên Drive vào thùng rác nếu có
      if (fileIdToDelete) {
        try {
          DriveApp.getFileById(fileIdToDelete).setTrashed(true);
        } catch(e){}
      }

      return createJsonResponse({
        status: "success",
        message: "Đã xóa kỷ niệm thành công!",
        deletedId: targetId
      });
    }

    return createJsonResponse({
      status: "error",
      message: "Action không hợp lệ: " + action
    });

  } catch (error) {
    return createJsonResponse({
      status: "error",
      message: "Lỗi xử lý doPost: " + error.toString()
    });
  }
}

/**
 * Trợ giúp: Định dạng ngày thành dạng chuỗi YYYY-MM-DD
 */
function formatDateString(val) {
  if (!val) return "";
  if (val instanceof Date) {
    return Utilities.formatDate(val, Session.getScriptTimeZone() || "GMT+7", "yyyy-MM-dd");
  }
  return String(val);
}

/**
 * Trả về phản hồi JSON với đầy đủ định dạng
 */
function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Hàm kiểm tra / khởi tạo bảng tính thủ công từ trình biên tập Apps Script
 */
function setupInitialSheet() {
  var sheet = getOrCreateSheet();
  var folder = getOrCreateFolder();
  Logger.log("Đã khởi tạo Sheet: " + sheet.getName());
  Logger.log("Thư mục Google Drive Media ID: " + folder.getId() + " - Tên: " + folder.getName());
}
