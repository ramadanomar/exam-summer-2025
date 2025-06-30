import EventEmitter from "../../utils/EventEmitter";
import { SERVER } from "../../config/global";

class SubscriptionStore {
  constructor() {
    this.emitter = new EventEmitter();
    this.subscriptions = [];
    this.totalCount = 0;
  }

  async subscribe(state, userId) {
    try {
      const response = await fetch(`${SERVER}/api/subscriptions`, {
        method: "POST",
        body: JSON.stringify({ userId }),
        headers: {
          Authorization: `Bearer ${state.currentUser.data.token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw response;
      }

      this.emitter.emit("SUBSCRIPTION_UPDATE_SUCCESS");
    } catch (err) {
      console.warn("Error subscribing:", err);
      this.emitter.emit("SUBSCRIPTION_UPDATE_ERROR", err);
    }
  }

  async unsubscribe(state, subscriptionId) {
    try {
      const response = await fetch(
        `${SERVER}/api/subscriptions/${subscriptionId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${state.currentUser.data.token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw response;
      }

      this.emitter.emit("SUBSCRIPTION_UPDATE_SUCCESS");
    } catch (err) {
      console.warn("Error unsubscribing:", err);
      this.emitter.emit("SUBSCRIPTION_UPDATE_ERROR", err);
    }
  }

  async getSubscriptions(
    state,
    page = 1,
    pageSize = 5,
    sortBy = "username",
    sortOrder = "ASC",
    partial = ""
  ) {
    try {
      const searchParams = {
        page,
        pageSize,
        sortBy,
        sortOrder,
        ...(partial ? { partial } : {}),
      };

      const queryParams = new URLSearchParams(searchParams).toString();

      const response = await fetch(
        `${SERVER}/api/subscriptions?${queryParams}`,
        {
          headers: {
            Authorization: `Bearer ${state.currentUser.data.token}`,
          },
        }
      );

      if (!response.ok) {
        throw response;
      }

      const data = await response.json();
      this.subscriptions = data.subscriptions;
      this.totalCount = data.totalCount;

      this.emitter.emit("SUBSCRIPTION_SEARCH_SUCCESS");
    } catch (err) {
      console.warn("Error getting subscriptions:", err);
      this.emitter.emit("SUBSCRIPTION_SEARCH_ERROR", err);
    }
  }

  clearSubscriptions() {
    this.subscriptions = [];
    this.totalCount = 0;
    this.emitter.emit("SUBSCRIPTION_CLEARED");
  }
}

export default SubscriptionStore;
