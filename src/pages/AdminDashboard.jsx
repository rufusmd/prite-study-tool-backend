// src/pages/AdminDashboard.jsx
import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import Alert from '../components/common/Alert';
import LoadingSpinner from '../components/common/LoadingSpinner';
import api from '../utils/api';

const AdminDashboard = () => {
    const { user } = useContext(AuthContext);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState({ pgyLevel: '', search: '' });
    const [stats, setStats] = useState({
        totalUsers: 0,
        usersByPgy: {},
        activeUsers: 0,
        questionsAdded: 0
    });

    // Fetch users on component mount
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                setLoading(true);
                const response = await api.get('/admin/users');

                if (response.data) {
                    setUsers(response.data);
                    calculateStats(response.data);
                }
            } catch (err) {
                console.error('Error fetching users:', err);
                setError('Failed to load users. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        // Only attempt to fetch if user is an admin
        if (user && user.isAdmin) {
            fetchUsers();
        } else {
            setLoading(false);
            setError('You do not have permission to access this page.');
        }
    }, [user]);

    // Calculate statistics from user data
    const calculateStats = (userData) => {
        const pgyLevels = {};
        let active = 0;
        let questionsCount = 0;

        userData.forEach(user => {
            // Count by PGY level
            const pgy = user.pgyLevel || 'Unspecified';
            pgyLevels[pgy] = (pgyLevels[pgy] || 0) + 1;

            // Count active users (logged in within last 30 days)
            const lastLogin = new Date(user.lastLogin || user.createdAt);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            if (lastLogin > thirtyDaysAgo) {
                active++;
            }

            // Count questions added
            questionsCount += user.questionsAdded || 0;
        });

        setStats({
            totalUsers: userData.length,
            usersByPgy: pgyLevels,
            activeUsers: active,
            questionsAdded: questionsCount
        });
    };

    // Filter users based on search and PGY level
    const filteredUsers = users.filter(user => {
        const matchesPgy = !filter.pgyLevel || user.pgyLevel === filter.pgyLevel;
        const matchesSearch = !filter.search ||
            user.username.toLowerCase().includes(filter.search.toLowerCase()) ||
            user.email.toLowerCase().includes(filter.search.toLowerCase());

        return matchesPgy && matchesSearch;
    });

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <LoadingSpinner />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4">
                <Alert type="error" message={error} />
            </div>
        );
    }

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="card p-4 flex flex-col items-center justify-center">
                    <p className="text-gray-500 text-sm">Total Users</p>
                    <p className="text-3xl font-bold text-primary">{stats.totalUsers}</p>
                </div>
                <div className="card p-4 flex flex-col items-center justify-center">
                    <p className="text-gray-500 text-sm">Active Users</p>
                    <p className="text-3xl font-bold text-success">{stats.activeUsers}</p>
                </div>
                <div className="card p-4 flex flex-col items-center justify-center">
                    <p className="text-gray-500 text-sm">Questions Added</p>
                    <p className="text-3xl font-bold text-warning">{stats.questionsAdded}</p>
                </div>
                <div className="card p-4 flex flex-col items-center justify-center">
                    <p className="text-gray-500 text-sm">Average Questions/User</p>
                    <p className="text-3xl font-bold text-info">
                        {stats.totalUsers > 0
                            ? Math.round(stats.questionsAdded / stats.totalUsers)
                            : 0}
                    </p>
                </div>
            </div>

            {/* PGY Level Distribution */}
            <div className="card p-4 mb-6">
                <h2 className="text-lg font-bold mb-4">User Distribution by PGY Level</h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {Object.entries(stats.usersByPgy).map(([level, count]) => (
                        <div key={level} className="bg-gray-100 p-3 rounded-lg text-center">
                            <div className="font-bold">{level}</div>
                            <div>{count} users</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* User Filter */}
            <div className="card p-4 mb-6">
                <h2 className="text-lg font-bold mb-4">User List</h2>

                <div className="flex flex-col md:flex-row gap-4 mb-4">
                    <div className="flex-grow">
                        <input
                            type="text"
                            placeholder="Search by username or email"
                            className="w-full p-2 border rounded"
                            value={filter.search}
                            onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                        />
                    </div>
                    <div>
                        <select
                            className="w-full p-2 border rounded"
                            value={filter.pgyLevel}
                            onChange={(e) => setFilter({ ...filter, pgyLevel: e.target.value })}
                        >
                            <option value="">All PGY Levels</option>
                            <option value="1">PGY-1</option>
                            <option value="2">PGY-2</option>
                            <option value="3">PGY-3</option>
                            <option value="4">PGY-4</option>
                            <option value="5">PGY-5</option>
                            <option value="6+">PGY-6+</option>
                            <option value="Fellow">Fellow</option>
                            <option value="Attending">Attending</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                </div>

                {/* User Table */}
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="py-2 px-4 border-b text-left">Username</th>
                                <th className="py-2 px-4 border-b text-left">Email</th>
                                <th className="py-2 px-4 border-b text-left">PGY Level</th>
                                <th className="py-2 px-4 border-b text-left">Joined</th>
                                <th className="py-2 px-4 border-b text-left">Questions Added</th>
                                <th className="py-2 px-4 border-b text-left">Admin</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.length > 0 ? (
                                filteredUsers.map(user => (
                                    <tr key={user._id} className="hover:bg-gray-50">
                                        <td className="py-2 px-4 border-b">{user.username}</td>
                                        <td className="py-2 px-4 border-b">{user.email}</td>
                                        <td className="py-2 px-4 border-b">{user.pgyLevel || 'Not specified'}</td>
                                        <td className="py-2 px-4 border-b">{new Date(user.createdAt).toLocaleDateString()}</td>
                                        <td className="py-2 px-4 border-b">{user.questionsAdded || 0}</td>
                                        <td className="py-2 px-4 border-b">
                                            {user.isAdmin ? (
                                                <span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs">
                                                    Admin
                                                </span>
                                            ) : (
                                                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                                                    User
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="py-4 text-center text-gray-500">
                                        No users found matching the filter criteria
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;