const {
  getNotifications,
  updateReadNocatifions,
  AllReadNotifications,
  DeleteNotifications,
} = require("../services/Nocations");

const getNotificationsAPI = async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await getNotifications(userId);

    return res.status(200).json({
      EC: 0,
      data: result,
    });
  } catch (error) {
    console.log(error);
  }
};

const updateReadNocatifionsAPI = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await updateReadNocatifions(id);
    return res.status(200).json({
      EC: 0,
      data: result,
    });
  } catch (error) {
    console.log(error);
  }
};

const AllReadNotificationsAPI = async (req, res) => {
  try {
    const { userId } = req.body;

    const data = await AllReadNotifications(userId);

    return res.status(200).json({
      EC: 0,
      data: data,
    });
  } catch (error) {
    console.log(error);
  }
};

const DeleteAllNotificationsAPI = async (req, res) => {
  try {
    const { userId } = req.params;

    const data = await DeleteNotifications(userId);

    return res.status(200).json({
      EC: 0,
      data: data,
    });
  } catch (error) {}
};

module.exports = {
  getNotificationsAPI,
  updateReadNocatifionsAPI,
  AllReadNotificationsAPI,
  DeleteAllNotificationsAPI,
};
