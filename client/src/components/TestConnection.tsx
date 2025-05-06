import { useState, useEffect } from 'react';
import axios from 'axios';

export const TestConnection = () => {
    const [message, setMessage] = useState<string>('');
    const [error, setError] = useState<string>('');

    useEffect(() => {
        const testConnection = async () => {
            try {
                const response = await axios.get('http://localhost:3000/test');
                setMessage(response.data.message);
                setError('');
            } catch (err) {
                setError('Erreur de connexion à l\'API');
                setMessage('');
            }
        };

        testConnection();
    }, []);

    return (
        <div>
            {message && <p style={{ color: 'green' }}>{message}</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
    );
}; 