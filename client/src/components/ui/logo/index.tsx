import { Link } from "react-router-dom";

const Logo = () => {
    return (
        // Utiliser Link de react-router au lieu de <a> pour éviter les problèmes de navigation
        <Link to="/" className="flex items-center space-x-1">
            <span className="font-bold text-xl">TaskFlow</span>
        </Link>
    );
};

export default Logo; 