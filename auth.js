const AuthForm = ({ onAuth }) => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            const { error } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    emailRedirectTo: window.location.origin,
                }
            });

            if (error) throw error;
            
            setMessage('Vérifiez vos emails pour le lien de connexion !');
        } catch (error) {
            setMessage('Erreur: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">Connexion</h2>
                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="mt-1 w-full border rounded p-2"
                            required
                        />
                    </div>
                    <button 
                        type="submit" 
                        className="w-full bg-blue-500 text-white py-2 rounded flex items-center justify-center"
                        disabled={loading}
                    >
                        {loading ? (
                            <div className="spinner h-5 w-5 border-2 border-white rounded-full border-t-transparent" />
                        ) : (
                            'Envoyer le lien magique'
                        )}
                    </button>
                    {message && (
                        <div className={`text-sm ${message.includes('Erreur') ? 'text-red-500' : 'text-green-500'}`}>
                            {message}
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

// Composant pour gérer l'état de l'authentification
const AuthProvider = ({ children }) => {
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Vérifier la session actuelle
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setLoading(false);
        });

        // Écouter les changements d'authentification
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    if (loading) {
        return (
            <div className="fixed inset-0 flex items-center justify-center">
                <div className="spinner h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
            </div>
        );
    }

    if (!session) {
        return <AuthForm />;
    }

    return children;
}; 