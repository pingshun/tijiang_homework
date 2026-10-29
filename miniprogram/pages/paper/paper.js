const { createPaper, formatDate, isValidPaper } = require("../../utils/paper.js");
const { createPdf } = require("../../utils/pdf.js");

const STORAGE_KEY = "dailyMathPaper";

Page({
  data: {
    paperDate: "",
    multiplication: [],
    additionSubtraction: [],
    answers: [],
    showAnswers: false,
    pdfBusy: false,
  },

  onShow() {
    const today = formatDate(new Date());
    let paper = wx.getStorageSync(STORAGE_KEY);
    if (!isValidPaper(paper) || paper.date !== today) {
      paper = createPaper(today);
      wx.setStorageSync(STORAGE_KEY, paper);
    }

    this.setData({
      paperDate: paper.date,
      multiplication: paper.questions.filter(question => question.section === "乘法题"),
      additionSubtraction: paper.questions.filter(question => question.section === "加减法题"),
      answers: paper.questions.map(question => ({ number: question.number, answer: question.answer })),
      showAnswers: false,
    });
    wx.showShareMenu({ withShareTicket: true });
  },

  goHome() {
    wx.reLaunch({ url: "/pages/index/index" });
  },

  toggleAnswers() {
    this.setData({ showAnswers: !this.data.showAnswers });
  },

  exportPdf() {
    const paper = wx.getStorageSync(STORAGE_KEY);
    if (!isValidPaper(paper)) {
      wx.showToast({ title: "试卷尚未准备好", icon: "none" });
      return;
    }

    const filePath = `${wx.env.USER_DATA_PATH}/daily-math-${paper.date}.pdf`;
    let pdf;
    try {
      pdf = createPdf(paper, this.data.showAnswers);
    } catch (error) {
      wx.showToast({ title: "PDF 生成失败", icon: "none" });
      return;
    }

    this.setData({ pdfBusy: true });
    wx.showLoading({ title: "正在生成 PDF" });
    wx.getFileSystemManager().writeFile({
      filePath,
      data: pdf,
      success: () => {
        wx.hideLoading();
        this.setData({ pdfBusy: false });
        this.openPdf(filePath);
      },
      fail: () => {
        wx.hideLoading();
        this.setData({ pdfBusy: false });
        wx.showToast({ title: "保存 PDF 失败", icon: "none" });
      },
    });
  },

  openPdf(filePath) {
    if (!filePath) return;
    wx.openDocument({
      filePath,
      fileType: "pdf",
      fail: () => wx.showToast({ title: "无法打开 PDF 文件", icon: "none" }),
    });
  },

  onShareAppMessage() {
    return {
      title: "题匠 · 今日份试卷(三上)",
      path: "/pages/paper/paper",
    };
  },
});
