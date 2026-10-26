// Tạo Google Form đăng ký và nối câu trả lời vào tab DangKy của Sheet này.
// Chạy một lần từ trình soạn Apps Script. Chạy lại sẽ không tạo thêm Form thứ hai.

var TEN_FORM_ = 'Đăng ký tham gia Learning Group';

var MO_TA_FORM_ =
  'Form này dùng để chia nhóm học tập cân bằng theo GPA.\n\n' +
  'Chúng mình thu: email Google (đã xác minh), họ tên, GPA. ' +
  'Chỉ lớp trưởng xem được GPA, GPA không hiện cho ai khác trên web. ' +
  'Điểm trong nhóm chỉ thành viên cùng nhóm xem được. ' +
  'Bạn có thể yêu cầu xóa dữ liệu cá nhân bất cứ lúc nào bằng cách nhắn lớp trưởng.\n\n' +
  'Mỗi người điền một lần.';

function taoFormDangKy() {
  var props = PropertiesService.getScriptProperties();
  var formId = props.getProperty('FORM_ID');
  if (formId) {
    var daCo = FormApp.openById(formId);
    Logger.log('Form đã tạo từ trước.\nLink gửi cho lớp: ' + daCo.getPublishedUrl() + '\nLink chỉnh sửa: ' + daCo.getEditUrl());
    return daCo.getPublishedUrl();
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var form = FormApp.create(TEN_FORM_);
  form.setDescription(MO_TA_FORM_);
  form.setCollectEmail(true);
  try {
    form.setEmailCollectionType(FormApp.EmailCollectionType.VERIFIED);
  } catch (e) {
    Logger.log('Không đặt được "email đã xác minh" bằng mã, hãy bật tay trong Cài đặt của Form. Chi tiết: ' + e);
  }
  try {
    form.setLimitOneResponsePerUser(true);
  } catch (e) {
    Logger.log('Không đặt được "mỗi người một lần" bằng mã, hãy bật tay trong Cài đặt của Form. Chi tiết: ' + e);
  }
  form.setAllowResponseEdits(false);
  form.setConfirmationMessage('Đã nhận đăng ký. Lớp trưởng sẽ chia nhóm và thông báo sau.');

  form.addTextItem().setTitle('Họ và tên').setRequired(true);

  var gpa = form.addTextItem()
    .setTitle('GPA hiện tại')
    .setHelpText('Nhập số, dùng dấu chấm. Ví dụ 3.25 (thang 4) hoặc 7.8 (thang 10). Chỉ lớp trưởng xem được.')
    .setRequired(true);
  gpa.setValidation(
    FormApp.createTextValidation()
      .setHelpText('Hãy nhập GPA là số từ 0 đến 10, dùng dấu chấm.')
      .requireNumberBetween(0, 10)
      .build()
  );

  form.addCheckboxItem()
    .setTitle('Xác nhận')
    .setChoiceValues(['Tôi đã đọc thông báo quyền riêng tư ở đầu Form và đồng ý để lớp trưởng dùng GPA vào việc chia nhóm'])
    .setRequired(true);

  // Đổi tên tab câu trả lời thành DangKy.
  var truoc = ss.getSheets().map(function (s) { return s.getSheetId(); });
  var cu = ss.getSheetByName('DangKy');
  if (cu && cu.getLastRow() <= 1) ss.deleteSheet(cu);
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
  SpreadsheetApp.flush();
  var moi = ss.getSheets().filter(function (s) { return truoc.indexOf(s.getSheetId()) === -1; });
  if (moi.length > 0) moi[0].setName('DangKy');

  props.setProperty('FORM_ID', form.getId());
  Logger.log('Đã tạo Form.\nLink gửi cho lớp: ' + form.getPublishedUrl() + '\nLink chỉnh sửa: ' + form.getEditUrl());
  return form.getPublishedUrl();
}

// Mở hoặc đóng nhận phản hồi. Dùng hai hàm này hoặc bật tắt tay trong tab Phản hồi của Form.
function moForm() {
  FormApp.openById(PropertiesService.getScriptProperties().getProperty('FORM_ID')).setAcceptingResponses(true);
}

function dongForm() {
  FormApp.openById(PropertiesService.getScriptProperties().getProperty('FORM_ID')).setAcceptingResponses(false);
}
