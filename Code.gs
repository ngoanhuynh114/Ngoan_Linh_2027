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

    if (action === "getMemories") {
      var sheet = getOrCreateSheet();
      var data = sheet.getDataRange().getValues();
      
      // Nếu chỉ có hàng tiêu đề
      if (data.length <= 1) {
        return createJsonResponse({ status: "success", data: [] });
      }

      var memories = [];
      // Bắt đầu đọc từ dòng thứ 2 (bỏ qua dòng tiêu đề)
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

      return createJsonResponse({
        status: "success",
        data: memories
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
