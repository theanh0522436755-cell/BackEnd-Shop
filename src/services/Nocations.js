const Notifications = require("../Model/Notifications");

const getNotifications = async (userId) => {
  try {
    const data = await Notifications.find({ userId: userId }).sort({
      createdAt: -1,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};
const updateReadNocatifions = async (id) => {
  try {
    const data = await Notifications.findByIdAndUpdate(
      id,
      { read: true },
      { new: true }
    );

    return data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

const AllReadNotifications = async (userId) => {
  try {
    const data = await Notifications.updateMany(
      { userId: userId }, // Điều kiện lọc
      { $set: { isCheck: true, read: true } }
    );

    console.log(data);

    return data;
  } catch (error) {
    console.log(error);
  }
};

const DeleteNotifications = async (userId) => {
  try {
    const data = await Notifications.deleteMany({
      userId: userId,
      isAdmin: false,
    });

    return data;
  } catch (error) {
    console.log(error);
  }
};
module.exports = {
  getNotifications,
  updateReadNocatifions,
  AllReadNotifications,
  DeleteNotifications,
};
