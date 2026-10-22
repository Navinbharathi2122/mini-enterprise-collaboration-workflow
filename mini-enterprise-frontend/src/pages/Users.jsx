
import { useEffect, useState } from "react";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

import CreateUserModal from "../components/CreateUserModal";
import EditUserModal from "../components/EditUserModal";
import DeleteUserModal from "../components/DeleteUserModal";

import { getAllUsers } from "../services/usersService";
import api from "../services/axios";

function Users() {
  // Current logged-in user from backend
  const [currentUser, setCurrentUser] = useState(null);
  const [roleLoading, setRoleLoading] = useState(true);
  const [roleError, setRoleError] = useState("");

  // Users list
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [roleFilter, setRoleFilter] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const role = String(currentUser?.role || "").toLowerCase();
  const isAdmin = role === "admin";
  const isManager = role === "manager";

  // Fetch current user using Auth0-configured shared Axios
  useEffect(() => {
    let cancelled = false;

    const fetchCurrentUser = async () => {
      try {
        setRoleLoading(true);
        setRoleError("");

        const response = await api.get("/users/me");

        if (!cancelled) {
          setCurrentUser(response.data);
        }
      } catch (error) {
        console.error("Error fetching current user:", error);

        if (!cancelled) {
          setRoleError(
            error.response?.data?.detail ||
              "Unable to verify your user role. Please refresh the page."
          );
        }
      } finally {
        if (!cancelled) {
          setRoleLoading(false);
        }
      }
    };

    fetchCurrentUser();

    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch all users after verifying the current user
  useEffect(() => {
    if (!currentUser || (!isAdmin && !isManager)) {
      setLoading(false);
      return;
    }

    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, page, roleFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);

      const data = await getAllUsers(page, 20, roleFilter);
      const rows = Array.isArray(data) ? data : [];
      setUsers(rows);
      setHasNextPage(rows.length === 20);
    } catch (error) {
      console.error("Error fetching users:", error);
      setUsers([]);

      alert(
        error.response?.data?.detail ||
          "Unable to fetch users. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Search by name or email
  const filteredUsers = users.filter((user) => {
    const name = String(user.name || "").toLowerCase();
    const email = String(user.email || "").toLowerCase();
    const query = search.toLowerCase();

    return name.includes(query) || email.includes(query);
  });

  const handleEdit = (user) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleDelete = (user) => {
    if (String(user.id) === String(currentUser?.id)) {
      alert("You cannot delete your own account.");
      return;
    }

    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  // Loading current user's role
  if (roleLoading) {
    return (
      <div style={styles.container}>
        <Sidebar />
        <div style={styles.main}>
          <Navbar />
          <div style={styles.content}>
            <div style={styles.messageCard}>
              Verifying user permissions...
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Role verification failed
  if (roleError || !currentUser) {
    return (
      <div style={styles.container}>
        <Sidebar />
        <div style={styles.main}>
          <Navbar />
          <div style={styles.content}>
            <div style={styles.messageCard}>
              <h2 style={styles.permissionTitle}>
                Unable to Verify Access
              </h2>
              <p style={styles.permissionText}>
                {roleError || "Current user information is unavailable."}
              </p>
              <button
                style={styles.addButton}
                onClick={() => window.location.reload()}
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Only Admin and Manager can access User Management
  if (!isAdmin && !isManager) {
    return (
      <div style={styles.container}>
        <Sidebar />
        <div style={styles.main}>
          <Navbar />
          <div style={styles.content}>
            <div style={styles.messageCard}>
              <h2 style={styles.permissionTitle}>
                Access Restricted
              </h2>
              <p style={styles.permissionText}>
                You don't have permission to access User Management.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <Sidebar />

      <div style={styles.main}>
        <Navbar />

        <div style={styles.content}>
          {/* Header */}
          <div style={styles.header}>
            <div>
              <h1 style={styles.title}>User Management</h1>
              <p style={styles.subtitle}>
                Manage users and view their roles.
              </p>
            </div>

            {isAdmin && (
              <button
                style={styles.addButton}
                onClick={() => setShowCreateModal(true)}
              >
                + Add User
              </button>
            )}
          </div>

          {/* Current user information */}
          <div style={styles.userInfo}>
            Logged in as:{" "}
            <strong>{currentUser.name || currentUser.email}</strong>
            {" · "}
            Role: <strong>{role.toUpperCase()}</strong>
          </div>

          {/* Search */}
          <input
            type="text"
            placeholder="Search user by name or email..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            style={styles.search}
          />

          <div className="mb-4 flex flex-wrap items-center gap-3">
            <label className="text-sm text-slate-600">Role
              <select className="ml-2 rounded-lg border border-slate-300 bg-white p-2" value={roleFilter} onChange={(event) => { setPage(1); setRoleFilter(event.target.value); }}>
                <option value="">All roles</option><option value="admin">Admin</option><option value="manager">Manager</option><option value="employee">Employee</option>
              </select>
            </label>
          </div>

          {/* Users table */}
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHead}>
                  <th style={styles.th}>ID</th>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>Role</th>
                  <th style={styles.th}>Status</th>
                  {isAdmin && <th style={styles.th}>Actions</th>}
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={isAdmin ? 6 : 5}
                      style={styles.empty}
                    >
                      Loading users...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={isAdmin ? 6 : 5}
                      style={styles.empty}
                    >
                      No users found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const userRole = String(
                      user.role || "employee"
                    ).toLowerCase();

                    return (
                      <tr key={user.id} style={styles.row}>
                        <td style={styles.td}>{user.id}</td>

                        <td style={styles.td}>
                          {user.name || "—"}
                        </td>

                        <td style={styles.td}>
                          {user.email || "—"}
                        </td>

                        <td style={styles.td}>
                          <span
                            style={{
                              ...styles.roleBadge,
                              ...(userRole === "admin"
                                ? styles.adminBadge
                                : userRole === "manager"
                                ? styles.managerBadge
                                : styles.employeeBadge),
                            }}
                          >
                            {userRole.toUpperCase()}
                          </span>
                        </td>

                        <td style={styles.td}>
                          <span
                            style={
                              user.is_active === false
                                ? styles.inactiveBadge
                                : styles.activeBadge
                            }
                          >
                            {user.is_active === false
                              ? "Inactive"
                              : "Active"}
                          </span>
                        </td>

                        {isAdmin && (
                          <td style={styles.td}>
                            <button
                              style={styles.editBtn}
                              onClick={() => handleEdit(user)}
                            >
                              Edit
                            </button>

                            <button
                              style={styles.deleteBtn}
                              onClick={() => handleDelete(user)}
                            >
                              Delete
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex items-center justify-between px-1">
            <span className="text-sm text-slate-600">Page {page} · {users.length} records on this page</span>
            <div className="flex gap-2">
              <button type="button" disabled={page === 1 || loading} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded-lg border bg-white px-4 py-2 disabled:opacity-40">Previous</button>
              <button type="button" disabled={!hasNextPage || loading} onClick={() => setPage((p) => p + 1)} className="rounded-lg border bg-white px-4 py-2 disabled:opacity-40">Next</button>
            </div>
          </div>

          {/* Create User Modal */}
          {showCreateModal && (
            <CreateUserModal
              closeModal={() => setShowCreateModal(false)}
              refreshUsers={fetchUsers}
            />
          )}

          {/* Edit User Modal */}
          {showEditModal && selectedUser && (
            <EditUserModal
              user={selectedUser}
              selectedUser={selectedUser}
              closeModal={() => {
                setShowEditModal(false);
                setSelectedUser(null);
              }}
              refreshUsers={fetchUsers}
            />
          )}

          {/* Delete User Modal */}
          {showDeleteModal && selectedUser && (
            <DeleteUserModal
              user={selectedUser}
              selectedUser={selectedUser}
              closeModal={() => {
                setShowDeleteModal(false);
                setSelectedUser(null);
              }}
              refreshUsers={fetchUsers}
            />
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    height: "100vh",
    width: "100vw",
    background: "#F4F7FB",
    overflow: "hidden",
    fontFamily: "Inter, sans-serif",
  },

  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
  },

  content: {
    flex: 1,
    padding: "30px",
    overflowY: "auto",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap",
    marginBottom: "24px",
  },

  title: {
    margin: 0,
    fontSize: "30px",
    fontWeight: "700",
    color: "#274690",
  },

  subtitle: {
    marginTop: "8px",
    marginBottom: 0,
    color: "#64748B",
    fontSize: "14px",
  },

  addButton: {
    background: "#274690",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "12px",
    padding: "12px 22px",
    fontWeight: "600",
    fontSize: "14px",
    cursor: "pointer",
    boxShadow: "0 8px 20px rgba(39,70,144,0.15)",
  },

  userInfo: {
    background: "#EAF1FF",
    color: "#274690",
    border: "1px solid #D6E2F3",
    borderRadius: "10px",
    padding: "12px 16px",
    marginBottom: "20px",
    fontSize: "14px",
  },

  search: {
    width: "100%",
    padding: "14px 18px",
    borderRadius: "12px",
    border: "1px solid #D6E2F3",
    outline: "none",
    marginBottom: "24px",
    fontSize: "15px",
    background: "#FFFFFF",
    color: "#334155",
    boxSizing: "border-box",
  },

  tableContainer: {
    background: "#FFFFFF",
    borderRadius: "18px",
    overflowX: "auto",
    border: "1px solid #E4ECF7",
    boxShadow: "0 10px 24px rgba(39,70,144,0.08)",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "650px",
  },

  tableHead: {
    background: "#EEF4FF",
  },

  th: {
    padding: "16px",
    textAlign: "left",
    color: "#274690",
    fontWeight: "700",
    fontSize: "14px",
    borderBottom: "1px solid #D8E3F2",
    whiteSpace: "nowrap",
  },

  row: {
    borderBottom: "1px solid #EEF2F7",
  },

  td: {
    padding: "15px 16px",
    color: "#334155",
    fontSize: "14px",
  },

  roleBadge: {
    display: "inline-block",
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "700",
    textTransform: "capitalize",
  },

  adminBadge: {
    background: "#DCE8FF",
    color: "#274690",
  },

  managerBadge: {
    background: "#E8F0FF",
    color: "#3459B8",
  },

  employeeBadge: {
    background: "#EEF2F7",
    color: "#475569",
  },

  activeBadge: {
    display: "inline-block",
    background: "#E8F7EE",
    color: "#15803D",
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "700",
  },

  inactiveBadge: {
    display: "inline-block",
    background: "#FEE2E2",
    color: "#B91C1C",
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "700",
  },

  editBtn: {
    background: "#274690",
    color: "#FFFFFF",
    border: "none",
    padding: "8px 14px",
    borderRadius: "8px",
    marginRight: "10px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "13px",
  },

  deleteBtn: {
    background: "#D64545",
    color: "#FFFFFF",
    border: "none",
    padding: "8px 14px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "13px",
  },

  empty: {
    textAlign: "center",
    padding: "28px",
    color: "#64748B",
    fontWeight: "600",
    fontSize: "15px",
  },

  messageCard: {
    background: "#FFFFFF",
    borderRadius: "18px",
    padding: "40px",
    textAlign: "center",
    boxShadow: "0 8px 20px rgba(39,70,144,0.08)",
    border: "1px solid #E4ECF7",
    color: "#64748B",
    lineHeight: 1.6,
  },

  permissionTitle: {
    color: "#D64545",
    marginBottom: "12px",
    fontSize: "24px",
    fontWeight: "700",
  },

  permissionText: {
    color: "#64748B",
    fontSize: "15px",
    margin: "0 0 20px",
  },
};

export default Users;
