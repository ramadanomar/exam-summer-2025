import React, { useState, useContext, useEffect, useCallback } from "react";
import "./Subscriptions.css";
import UserCardList from "../UserCardList";
import Paginator from "../Paginator";
import AppContext from "../../state/AppContext";

const Subscriptions = () => {
  const globalState = useContext(AppContext);

  const [subscriptionData, setSubscriptionData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("username");
  const [sortOrder, setSortOrder] = useState("ASC");
  const [pageSize, setPageSize] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const searchSuccessListener = globalState.subscriptions.emitter.addListener(
      "SUBSCRIPTION_SEARCH_SUCCESS",
      () => {
        setSubscriptionData(globalState.subscriptions.subscriptions);
        setTotalCount(globalState.subscriptions.totalCount);
      }
    );

    return () => {
      searchSuccessListener.remove();
      globalState.subscriptions.clearSubscriptions();
    };
  }, []);

  const handleSearch = useCallback(() => {
    globalState.subscriptions.getSubscriptions(
      globalState,
      currentPage,
      pageSize,
      sortBy,
      sortOrder,
      searchTerm
    );
  }, [globalState, currentPage, pageSize, sortBy, sortOrder, searchTerm]);

  useEffect(() => {
    const subscriptionSuccessListener =
      globalState.subscriptions.emitter.addListener(
        "SUBSCRIPTION_UPDATE_SUCCESS",
        () => {
          handleSearch();
        }
      );

    return () => {
      subscriptionSuccessListener.remove();
    };
  }, [handleSearch]);

  useEffect(() => {
    handleSearch();
  }, [handleSearch]);

  function handlePageChange(newPage) {
    setCurrentPage(newPage);
  }

  function handlePageSizeChange(newSize) {
    setPageSize(newSize);
    setCurrentPage(1); // Reset to first page when page size changes
  }

  return (
    <div className="subscriptions-container">
      <div className="page-title">
        <h2>Subscriptions</h2>
        <p>who are you listening to?</p>
      </div>

      <div className="subscriptions-controls">
        <input
          type="text"
          placeholder="Search subscriptions by username, name, or email"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="subscription-search-input"
        />

        <div className="subscription-options">
          <div className="option-group">
            <label>Sort by:</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="username">Username</option>
              <option value="name">Name</option>
              <option value="email">Email</option>
              <option value="createdAt">Subscription Date</option>
            </select>
          </div>

          <div className="option-group">
            <label>Order:</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="ASC">Ascending</option>
              <option value="DESC">Descending</option>
            </select>
          </div>
        </div>
      </div>

      <UserCardList
        data={subscriptionData.map((subscription) => ({
          ...subscription.subscribed,
          subscriptionId: subscription.id,
        }))}
      />

      <Paginator
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        totalRecords={totalCount}
      />
    </div>
  );
};

export default Subscriptions;
