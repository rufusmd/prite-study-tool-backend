// src/layouts/MobileLayout.jsx
import { Outlet } from 'react-router-dom';
import Header from '../components/common/Header';
import BottomNavBar from '../components/common/BottomNavBar';
import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';

const MobileLayout = () => {
    const { loading } = useContext(AuthContext);

    if (loading) {
        return <LoadingSpinner fullScreen={true} />;
    }

    return (
        <div className="mobile-container min-h-screen bg-gray-50">
            <Header />

            <main className="p-4 pb-20">
                <Outlet />
            </main>

            <BottomNavBar />
        </div>
    );
};

export default MobileLayout;