const {
  createChangeModel,
  getChangeModel,
  updateChangeModel,
  DeletehangeModel,
} = require("../services/Change");

const createChangeModelAPI = async (req, res) => {
  try {
    const { newChangelog } = req.body;

    const saved = await createChangeModel(newChangelog);
    res.status(201).json({ success: true, data: saved });
  } catch (error) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const getChangeModelAPI = async (req, res) => {
  try {
    const data = await getChangeModel();
    return res.status(200).json({ success: true, data: data });
  } catch (error) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

const updateChangeModelAPI = async (req, res) => {
  try {
    const { id } = req.params;
    const { changelogData } = req.body;

    const data = await updateChangeModel(id, changelogData);

    return res.status(200).json({ success: true, data: data });
  } catch (error) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

const DeletehangeModelAPI = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await DeletehangeModel(id);

    return res.status(200).json({
      data: data,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

module.exports = {
  createChangeModelAPI,
  getChangeModelAPI,
  updateChangeModelAPI,
  DeletehangeModelAPI,
};
