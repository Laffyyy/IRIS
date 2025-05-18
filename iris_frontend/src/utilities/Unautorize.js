import React from 'react';

const styles = {
    container: {
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#f8f9fa',
    },
    card: {
        background: '#fff',
        padding: '40px 30px',
        borderRadius: '12px',
        boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
        textAlign: 'center',
        maxWidth: '350px',
    },
    icon: {
        fontSize: '48px',
        color: '#e74c3c',
        marginBottom: '16px',
    },
    title: {
        fontSize: '2rem',
        fontWeight: 'bold',
        marginBottom: '12px',
        color: '#333',
    },
    message: {
        fontSize: '1rem',
        color: '#666',
        marginBottom: '24px',
    },
    button: {
        padding: '10px 24px',
        background: '#3498db',
        color: '#fff',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '1rem',
        textDecoration: 'none',
    }
};

function Unauthorize() {
    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <div style={styles.icon}>🚫</div>
                <div style={styles.title}>Unauthorized</div>
                <div style={styles.message}>
                    You do not have permission to view this page.<br />
                    Please login or contact the administrator.
                </div>
                <a href="/" style={styles.button}>Go Home</a>
            </div>
        </div>
    );
}

export default Unauthorize;