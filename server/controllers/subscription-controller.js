import models from "../models/index.js";
import { Op } from "sequelize";

const subscribe = async (req, res, next) => {
  try {
    const subscribedId = req.body.userId;
    const subscriberId = req.user.id;

    if (subscribedId === subscriberId) {
      return res
        .status(400)
        .json({ message: "You cannot subscribe to yourself" });
    }

    const userExists = await models.User.findByPk(subscribedId);
    if (!userExists) {
      return res.status(404).json({ message: "User not found" });
    }

    const existingSubscription = await models.Subscription.findOne({
      where: {
        subscriberId: subscriberId,
        subscribedId: subscribedId,
      },
    });

    if (existingSubscription) {
      return res
        .status(400)
        .json({ message: "Already subscribed to this user" });
    }

    await models.Subscription.create({
      subscriberId: subscriberId,
      subscribedId: subscribedId,
    });

    res.status(201).json({ message: "Subscription created successfully" });
  } catch (err) {
    next(err);
  }
};

const unsubscribe = async (req, res, next) => {
  try {
    const subscriptionId = req.params.subscriptionId;

    await models.Subscription.destroy({
      where: {
        id: subscriptionId,
        subscriberId: req.user.id,
      },
    });

    res.status(200).json({ message: "Unsubscribed successfully" });
  } catch (err) {
    next(err);
  }
};

const getSubscriptions = async (req, res, next) => {
  try {
    const {
      page = 1,
      pageSize = 5,
      sortBy = "username",
      sortOrder = "ASC",
      partial = "",
    } = req.query;

    const limit = parseInt(pageSize);
    const offset = (parseInt(page) - 1) * limit;

    // Build where clause for filtering
    let includeWhere = {};
    if (partial && partial.trim() !== "") {
      includeWhere = {
        [Op.or]: [
          { username: { [Op.like]: `%${partial}%` } },
          { email: { [Op.like]: `%${partial}%` } },
          { name: { [Op.like]: `%${partial}%` } },
        ],
      };
    }

    // Validate sortBy field
    const allowedSortFields = ["username", "email", "name", "createdAt"];
    const validSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : "username";
    const validSortOrder = ["ASC", "DESC"].includes(sortOrder?.toUpperCase())
      ? sortOrder.toUpperCase()
      : "ASC";

    const includeConfig = {
      model: models.User,
      as: "subscribed",
      attributes: ["id", "username", "name", "email"],
    };

    // Only add where clause if we have a filter
    if (partial && partial.trim() !== "") {
      includeConfig.where = includeWhere;
    }

    const { count, rows: subscriptions } =
      await models.Subscription.findAndCountAll({
        where: {
          subscriberId: req.user.id,
        },
        attributes: ["id", "createdAt"],
        include: [includeConfig],
        order: [
          [
            { model: models.User, as: "subscribed" },
            validSortBy,
            validSortOrder,
          ],
        ],
        limit,
        offset,
        distinct: true,
      });

    res.status(200).json({
      subscriptions,
      totalCount: count,
      currentPage: parseInt(page),
      pageSize: limit,
      totalPages: Math.ceil(count / limit),
    });
  } catch (err) {
    next(err);
  }
};

export default {
  subscribe,
  unsubscribe,
  getSubscriptions,
};
