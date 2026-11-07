import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  ExternalLink, 
  Database, 
  FolderCheck, 
  FileCode, 
  BookOpen, 
  Download,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Cloud
} from 'lucide-react';
import { pingGas } from '../services/api';

interface GasSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  gasUrl: string;
  onSaveGasUrl: (url: string) => void;
  onSyncNow: () => Promise<void>;
}

export const GasSetupModal: React.FC<GasSetupModalProps> = ({
  isOpen,
  onClose,
  gasUrl,
  onSaveGasUrl,
  onSyncNow,
}) => {
  const [activeTab, setActiveTab] = useState<'config' | 'guide' | 'code' | 'standalone'>('config');
  const [inputUrl, setInputUrl] = useState(gasUrl || '');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);
  const [pingStatus, setPingStatus] = useState<{
    tested: boolean;
    success: boolean;
    message: string;
  } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    if (!inputUrl.trim()) {
      setPingStatus({
        tested: true,
        success: false,
        message: 'Vui lòng nhập Web App URL trước khi kiểm tra!',
      });
      return;
    }

    try {
      setIsTesting(true);
      setPingStatus(null);
      const res = await pingGas(inputUrl.trim());
      if (res.status === 'success') {
        setPingStatus({
          tested: true,
          success: true,
          message: res.message || 'Kết nối thành công tới Google Apps Script!',
        });
        onSaveGasUrl(inputUrl.trim());
      } else {
        setPingStatus({
          tested: true,
          success: false,
          message: res.message || 'Không thể kết nối. Kiểm tra quyền "Anyone" khi deploy!',
        });
      }
    } catch (err: any) {
      setPingStatus({
        tested: true,
        success: false,
        message: err.message || 'Lỗi mạng khi kết nối',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveAndSync = async () => {
    onSaveGasUrl(inputUrl.trim());
    try {
      setIsSyncing(true);
      await onSyncNow();
      alert('Đã lưu cấu hình và tải dữ liệu từ Google Sheets!');
      onClose();
    } catch (err: any) {
      alert(`Đã lưu URL nhưng không thể lấy dữ liệu: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const sampleGasCode = `/**
 * ============================================================================
 * GOOGLE APPS SCRIPT BACKEND: NHẬT KÝ MẸ & BÉ
 * ============================================================================
 */

// Điền ID thư mục Google Drive của bạn (nếu để trống hệ thống tự tạo thư mục)
var DRIVE_FOLDER_ID = ""; 
var SHEET_NAME = "NhatKy";
var SHEET_HEADERS = ["ID", "Ngày", "Tiêu đề", "Nội dung", "Giai đoạn", "Cột mốc / Tuần tuổi", "Loại media", "Media URL", "Google Drive File ID", "Ngày tạo", "Cảm xúc"];

function getOrCreateSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(SHEET_HEADERS);
    sheet.getRange(1, 1, 1, SHEET_HEADERS.length).setBackground("#FCE7F3").setFontWeight("bold").setFontColor("#9D174D");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function getOrCreateFolder() {
  if (DRIVE_FOLDER_ID && DRIVE_FOLDER_ID.trim() !== "") {
    try { return DriveApp.getFolderById(DRIVE_FOLDER_ID.trim()); } catch(e){}
  }
  var folders = DriveApp.getFoldersByName("NhatKyMeVaBe_Media");
  if (folders.hasNext()) return folders.next();
  var folder = DriveApp.createFolder("NhatKyMeVaBe_Media");
  folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return folder;
}

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "getMemories";
  try {
    if (action === "ping") {
      return createJsonResponse({ status: "success", message: "Google Apps Script Backend hoạt động tốt!" });
    }
    if (action === "getMemories") {
      var sheet = getOrCreateSheet();
      var data = sheet.getDataRange().getValues();
      if (data.length <= 1) return createJsonResponse({ status: "success", data: [] });
      var memories = [];
      for (var i = 1; i < data.length; i++) {
        var row = data[i];
        if (!row[0]) continue;
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
          emotions: row[10] ? String(row[10]).split(",").map(function(s){ return s.trim(); }) : []
        });
      }
      memories.sort(function(a, b) { return new Date(b.date).getTime() - new Date(a.date).getTime(); });
      return createJsonResponse({ status: "success", data: memories });
    }
    return createJsonResponse({ status: "error", message: "Invalid action" });
  } catch(err) {
    return createJsonResponse({ status: "error", message: err.toString() });
  }
}

function doPost(e) {
  try {
    var req = {};
    if (e.postData && e.postData.contents) req = JSON.parse(e.postData.contents);
    else req = e.parameter || {};
    var action = req.action || "createMemory";

    if (action === "createMemory") {
      var sheet = getOrCreateSheet();
      var id = "mem_" + new Date().getTime();
      var nowIso = new Date().toISOString();
      var driveFileId = "";
      var mediaUrl = req.mediaUrl || "";
      var mediaType = req.mediaType || "none";

      if (req.fileBase64 && req.fileName) {
        var folder = getOrCreateFolder();
        var rawData = req.fileBase64;
        if (rawData.indexOf("base64,") !== -1) rawData = rawData.split("base64,")[1];
        var decoded = Utilities.base64Decode(rawData);
        var mime = req.mimeType || "image/jpeg";
        var file = folder.createFile(Utilities.newBlob(decoded, mime, "Baby_" + req.date + "_" + req.fileName));
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        driveFileId = file.getId();
        mediaUrl = "https://lh3.googleusercontent.com/d/" + driveFileId;
        mediaType = mime.indexOf("video") !== -1 ? "video" : "image";
      }

      var emotions = Array.isArray(req.emotions) ? req.emotions.join(", ") : (req.emotions || "");
      sheet.appendRow([id, req.date, req.title, req.content, req.stage, req.milestoneTag || req.weekOrAge || "", mediaType, mediaUrl, driveFileId, nowIso, emotions]);

      return createJsonResponse({
        status: "success",
        message: "Đã lưu kỷ niệm thành công!",
        newMemory: { id: id, date: req.date, title: req.title, content: req.content, stage: req.stage, milestoneTag: req.milestoneTag, weekOrAge: req.weekOrAge, mediaType: mediaType, mediaUrl: mediaUrl, driveFileId: driveFileId, createdAt: nowIso, emotions: req.emotions || [] }
      });
    }

    if (action === "updateMemory") {
      var sheet = getOrCreateSheet();
      var data = sheet.getDataRange().getValues();
      var targetId = req.id;
      var foundRow = -1;
      for (var i = 1; i < data.length; i++) {
        if (String(data[i][0]) === String(targetId)) { foundRow = i + 1; break; }
      }
      if (foundRow === -1) return createJsonResponse({ status: "error", message: "Không tìm thấy bài viết" });

      var driveFileId = data[foundRow - 1][8] || "";
      var mediaUrl = req.mediaUrl || data[foundRow - 1][7] || "";
      var mediaType = req.mediaType || data[foundRow - 1][6] || "none";

      if (req.fileBase64 && req.fileName) {
        var folder = getOrCreateFolder();
        var rawData = req.fileBase64;
        if (rawData.indexOf("base64,") !== -1) rawData = rawData.split("base64,")[1];
        var decoded = Utilities.base64Decode(rawData);
        var mime = req.mimeType || "image/jpeg";
        var file = folder.createFile(Utilities.newBlob(decoded, mime, "Baby_" + (req.date || "up") + "_" + req.fileName));
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        driveFileId = file.getId();
        mediaUrl = "https://lh3.googleusercontent.com/d/" + driveFileId;
        mediaType = mime.indexOf("video") !== -1 ? "video" : "image";
      }

      sheet.getRange(foundRow, 2).setValue(req.date || data[foundRow - 1][1]);
      sheet.getRange(foundRow, 3).setValue(req.title || data[foundRow - 1][2]);
      sheet.getRange(foundRow, 4).setValue(req.content || data[foundRow - 1][3]);
      sheet.getRange(foundRow, 5).setValue(req.stage || data[foundRow - 1][4]);
      sheet.getRange(foundRow, 6).setValue(req.milestoneTag || data[foundRow - 1][5]);
      sheet.getRange(foundRow, 7).setValue(mediaType);
      sheet.getRange(foundRow, 8).setValue(mediaUrl);
      sheet.getRange(foundRow, 9).setValue(driveFileId);
      sheet.getRange(foundRow, 11).setValue(Array.isArray(req.emotions) ? req.emotions.join(", ") : (req.emotions || ""));

      return createJsonResponse({ status: "success", message: "Cập nhật thành công!" });
    }

    if (action === "deleteMemory") {
      var sheet = getOrCreateSheet();
      var data = sheet.getDataRange().getValues();
      for (var i = 1; i < data.length; i++) {
        if (String(data[i][0]) === String(req.id)) {
          if (data[i][8]) { try { DriveApp.getFileById(data[i][8]).setTrashed(true); } catch(e){} }
          sheet.deleteRow(i + 1);
          return createJsonResponse({ status: "success", message: "Đã xóa kỷ niệm!" });
        }
      }
      return createJsonResponse({ status: "error", message: "Không tìm thấy kỷ niệm để xóa" });
    }

    return createJsonResponse({ status: "error", message: "Unknown action" });
  } catch(err) {
    return createJsonResponse({ status: "error", message: err.toString() });
  }
}

function formatDateString(val) {
  if (!val) return "";
  if (val instanceof Date) return Utilities.formatDate(val, Session.getScriptTimeZone() || "GMT+7", "yyyy-MM-dd");
  return String(val);
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}`;

  const copyToClipboard = (text: string, isCode: boolean) => {
    navigator.clipboard.writeText(text);
    if (isCode) {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } else {
      setCopiedHtml(true);
      setTimeout(() => setCopiedHtml(false), 2000);
    }
  };

  const downloadFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/50 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-rose-100 overflow-hidden my-6">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-rose-50 via-pink-50 to-amber-50 border-b border-rose-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-xs">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-stone-800">
                Kết Nối Google Apps Script & Google Sheets
              </h3>
              <p className="text-xs text-stone-500">
                Lưu trữ vĩnh viễn bài viết trên Google Sheets & media trên Google Drive miễn phí
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center border-b border-stone-100 px-4 sm:px-6 bg-stone-50/70 overflow-x-auto">
          <button
            onClick={() => setActiveTab('config')}
            className={`py-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'config'
                ? 'border-rose-500 text-rose-600'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Cloud className="w-4 h-4" />
            <span>1. Cấu hình Web App URL</span>
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`py-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'guide'
                ? 'border-rose-500 text-rose-600'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>2. Hướng dẫn triển khai (4 bước)</span>
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`py-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'code'
                ? 'border-rose-500 text-rose-600'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>3. Mã nguồn Code.gs</span>
          </button>
          <button
            onClick={() => setActiveTab('standalone')}
            className={`py-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'standalone'
                ? 'border-rose-500 text-rose-600'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>4. Bản chạy độc lập (1 File HTML)</span>
          </button>
        </div>

        {/* Tab 1: Configuration */}
        {activeTab === 'config' && (
          <div className="p-4 sm:p-6 space-y-5 max-h-[70vh] overflow-y-auto">
            <div className="bg-amber-50/80 rounded-2xl p-4 border border-amber-200/80 text-xs text-amber-900 space-y-1.5">
              <div className="font-bold flex items-center gap-1.5 text-amber-800">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Trạng thái hoạt động hiện tại:</span>
              </div>
              <p>
                {gasUrl ? (
                  <span className="text-emerald-700 font-semibold">
                    ✅ Đã kết nối với Web App: <span className="font-mono text-[11px] underline">{gasUrl}</span>
                  </span>
                ) : (
                  <span>
                    💡 Ứng dụng đang chạy ở chế độ <strong>Lưu trữ cục bộ (Local Storage)</strong>. Mọi bài viết bạn tạo vẫn được lưu an toàn trong trình duyệt. Khi bạn dán Google Apps Script Web App URL bên dưới, dữ liệu sẽ tự động đồng bộ lên Google Sheets và ảnh/video lưu vào Google Drive!
                  </span>
                )}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-700 block">
                Google Apps Script Web App URL:
              </label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="url"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                  className="flex-1 px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-stone-300 focus:border-rose-500 focus:outline-hidden font-mono"
                />
                <button
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 shrink-0"
                >
                  {isTesting ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  )}
                  <span>Kiểm tra kết nối</span>
                </button>
              </div>
              <p className="text-[11px] text-stone-400">
                URL này có đuôi <code className="bg-stone-100 px-1 py-0.5 rounded text-stone-600 font-mono">/exec</code> được cấp sau khi bạn nhấn "Deploy" &gt; "New deployment" trên Apps Script.
              </p>
            </div>

            {/* Test result status box */}
            {pingStatus && (
              <div
                className={`p-3.5 rounded-2xl text-xs flex items-center gap-2 border ${
                  pingStatus.success
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-red-50 text-red-800 border-red-200'
                }`}
              >
                {pingStatus.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                )}
                <span>{pingStatus.message}</span>
              </div>
            )}

            <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setInputUrl('');
                  onSaveGasUrl('');
                  alert('Đã xóa cấu hình GAS, quay về chế độ Local Storage.');
                }}
                className="text-xs text-stone-400 hover:text-red-600"
              >
                Xóa URL kết nối
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={handleSaveAndSync}
                  disabled={isSyncing}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs sm:text-sm font-semibold shadow-xs hover:from-rose-600 hover:to-pink-600 transition-all flex items-center gap-1.5"
                >
                  {isSyncing ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Cloud className="w-4 h-4" />
                  )}
                  <span>Lưu & Đồng bộ ngay</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Step-by-step Guide */}
        {activeTab === 'guide' && (
          <div className="p-4 sm:p-6 space-y-4 max-h-[70vh] overflow-y-auto text-stone-700 text-xs sm:text-sm leading-relaxed">
            <h4 className="font-bold text-base text-rose-600">
              Hướng dẫn triển khai Google Apps Script từng bước (Chỉ mất 2 phút)
            </h4>

            {/* Step 1 */}
            <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-100 space-y-1.5">
              <div className="font-bold text-stone-800 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-xs flex items-center justify-center">1</span>
                <span>Tạo Google Sheet mới</span>
              </div>
              <p className="text-stone-600">
                Truy cập <a href="https://sheets.new" target="_blank" rel="noreferrer" className="text-rose-600 underline font-semibold">sheets.new</a> để tạo 1 file Google Sheet mới (Đặt tên: <em>"Nhật Ký Mẹ & Bé"</em>). Bạn <strong>không cần tự gõ tiêu đề cột</strong>, mã Script sẽ tự động tạo bảng và tô màu pastel tiêu đề khi chạy lần đầu!
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-4 rounded-2xl bg-pink-50/50 border border-pink-100 space-y-1.5">
              <div className="font-bold text-stone-800 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-pink-500 text-white text-xs flex items-center justify-center">2</span>
                <span>Mở trình biên tập Apps Script</span>
              </div>
              <p className="text-stone-600">
                Trên menu thanh công cụ của Google Sheet, chọn: <strong className="bg-white px-1.5 py-0.5 rounded border border-pink-200">Tiện ích mở rộng (Extensions)</strong> &gt; <strong className="bg-white px-1.5 py-0.5 rounded border border-pink-200">Apps Script</strong>.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100 space-y-1.5">
              <div className="font-bold text-stone-800 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center">3</span>
                <span>Dán mã nguồn Code.gs</span>
              </div>
              <p className="text-stone-600">
                Xóa toàn bộ nội dung mặc định trong file <code className="font-mono bg-white px-1 py-0.5 rounded border border-amber-200">Mã.gs</code> (hoặc Code.gs), sau đó chuyển sang tab <strong>"3. Mã nguồn Code.gs"</strong> ở modal này, nhấn <strong>"Sao chép mã"</strong> và dán vào Apps Script. Nhấn biểu tượng đĩa mềm 💾 (Lưu).
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-2">
              <div className="font-bold text-stone-800 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center">4</span>
                <span>Triển khai (Deploy Web App) - QUAN TRỌNG NHẤT</span>
              </div>
              <ul className="list-disc pl-5 space-y-1 text-stone-600">
                <li>Ở góc trên bên phải Apps Script, nhấn nút <strong>Triển khai (Deploy)</strong> &gt; <strong>Tùy chọn triển khai mới (New deployment)</strong>.</li>
                <li>Chọn loại: Biểu tượng bánh răng ⚙️ &gt; Chọn <strong>Ứng dụng web (Web app)</strong>.</li>
                <li>Mô tả: <em>"Baby Diary API"</em>.</li>
                <li><strong>Thực thi dưới dạng (Execute as):</strong> Chọn <code>Tôi (Me - your email)</code>.</li>
                <li><strong>Người có quyền truy cập (Who has access):</strong> Chọn <strong className="text-rose-600">Bất kỳ ai (Anyone)</strong>.</li>
                <li>Nhấn <strong>Triển khai (Deploy)</strong>, cấp quyền truy cập tài khoản Google khi được hỏi.</li>
                <li>Sao chép đường dẫn <strong>URL ứng dụng web (Web App URL)</strong> có đuôi <code>/exec</code> và dán vào tab <strong>"1. Cấu hình Web App URL"</strong> trong ứng dụng này!</li>
              </ul>
            </div>
          </div>
        )}

        {/* Tab 3: Code.gs */}
        {activeTab === 'code' && (
          <div className="p-4 sm:p-6 space-y-3 max-h-[70vh] overflow-y-auto">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-stone-600">
                Toàn bộ mã nguồn file <code>Code.gs</code>:
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => downloadFile('Code.gs', sampleGasCode)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-stone-100 text-stone-700 hover:bg-stone-200 transition-colors flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Tải file .gs</span>
                </button>
                <button
                  onClick={() => copyToClipboard(sampleGasCode, true)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-500 text-white hover:bg-rose-600 transition-colors flex items-center gap-1 shadow-2xs"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Đã sao chép!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Sao chép mã</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <pre className="p-4 rounded-2xl bg-stone-900 text-stone-100 font-mono text-xs overflow-x-auto max-h-[50vh] leading-relaxed border border-stone-800">
              <code>{sampleGasCode}</code>
            </pre>
          </div>
        )}

        {/* Tab 4: Standalone index.html */}
        {activeTab === 'standalone' && (
          <div className="p-4 sm:p-6 space-y-4 max-h-[70vh] overflow-y-auto text-stone-700 text-xs sm:text-sm">
            <div className="bg-pink-50 rounded-2xl p-4 border border-pink-100 space-y-2">
              <h4 className="font-bold text-pink-900">
                Bản SPA 1 file duy nhất (Single-File index.html)
              </h4>
              <p className="text-stone-600">
                Đúng theo yêu cầu kiến trúc của bạn: Bạn có thể tải file <code className="bg-white px-1.5 py-0.5 rounded text-pink-700 font-bold border border-pink-200">index.html</code> độc lập. File này tích hợp sẵn Tailwind CSS CDN, Font chữ Google, đầy đủ giao diện Timeline, Form thêm kỷ niệm Base64 và trình kết nối Google Apps Script.
              </p>
              <p className="text-stone-600">
                Chỉ cần nhấp đúp để mở trên máy tính, hoặc đẩy lên GitHub Pages, Vercel, Netlify là chạy ngay mà không cần cấu hình Node.js hay build server!
              </p>
            </div>

            <div className="flex items-center gap-3">
              <a
                href="/standalone_index.html"
                download="index.html"
                className="px-4 py-2.5 rounded-2xl bg-rose-500 text-white font-semibold text-xs flex items-center gap-2 hover:bg-rose-600 transition-colors shadow-xs"
              >
                <Download className="w-4 h-4" />
                <span>Tải file index.html độc lập</span>
              </a>
              <a
                href="/standalone_index.html"
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2.5 rounded-2xl bg-stone-100 text-stone-700 font-semibold text-xs flex items-center gap-2 hover:bg-stone-200 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Mở xem trong tab mới</span>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
