const { formatDate } = require("../../utils/paper.js");

Page({
  data: {
    dateLabel: "",
  },

  onShow() {
    this.setData({ dateLabel: formatDate(new Date()) });
    wx.showShareMenu({ withShareTicket: true });
  },

  openPaper() {
    wx.navigateTo({ url: "/pages/paper/paper" });
  },

  onShareAppMessage() {
    return {
      title: "题匠 · 今日份试卷(三上)",
      path: "/pages/index/index",
    };
  },
});
