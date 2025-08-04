// src/components/common/Header.jsx
import { useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';

const Header = () => {
    const { user } = useContext(AuthContext);

    return (
        <header className="py-4 px-4 bg-white shadow-sm flex items-center justify-between">
            <h1 className="text-xl font-bold text-center text-gray-800">PRITE Study Tool</h1>

            {user && (
                <div className="text-sm text-gray-600">
                    {user.username}
                </div>
            )}
        </header>
    );
};

export default Header;