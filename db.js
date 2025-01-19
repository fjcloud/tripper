window.useTrip = (tripId) => {
    const [trip, setTrip] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!tripId) return;

        const fetchTrip = async () => {
            try {
                // Récupérer le voyage
                const { data: tripData, error: tripError } = await supabase
                    .from('trips')
                    .select('*')
                    .eq('id', tripId)
                    .single();

                if (tripError) throw tripError;

                // Récupérer les informations de partage séparément si nécessaire
                const { data: shareData } = await supabase
                    .from('trip_shares')
                    .select('*')
                    .eq('trip_id', tripId)
                    .eq('shared_with_email', await supabase.auth.getUser().then(d => d.data.user.email));

                setTrip({
                    ...tripData,
                    share_info: shareData?.[0]
                });
            } catch (err) {
                console.error('Erreur lors de la récupération du voyage:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchTrip();

        // Souscrire aux changements
        const tripSubscription = supabase
            .channel(`public:trips:id=eq.${tripId}`)
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'trips',
                filter: `id=eq.${tripId}`
            }, async (payload) => {
                console.log('Trip updated:', payload);
                if (payload.new) {
                    // Recharger les données complètes
                    await fetchTrip();
                }
            })
            .subscribe();

        return () => {
            tripSubscription.unsubscribe();
        };
    }, [tripId]);

    return { trip, loading, error };
};

window.useTrips = () => {
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchTrips = async () => {
        try {
            const { data, error } = await supabase
                .from('trips')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setTrips(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTrips();

        const subscription = supabase
            .channel('trips')
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'trips' 
            }, fetchTrips)
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const createTrip = async (name, data) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            
            const { data: trip, error } = await supabase
                .from('trips')
                .insert([{
                    name,
                    data,
                    owner_id: user.id
                }])
                .select()
                .single();

            if (error) throw error;
            return trip;
        } catch (err) {
            setError(err.message);
            console.error('Erreur création voyage:', err);
            return null;
        }
    };

    const updateTrip = async (tripId, updates) => {
        try {
            const { error } = await supabase
                .from('trips')
                .update(updates)
                .eq('id', tripId);

            if (error) throw error;
        } catch (err) {
            setError(err.message);
        }
    };

    const deleteTrip = async (tripId) => {
        try {
            const { error } = await supabase
                .from('trips')
                .delete()
                .eq('id', tripId);

            if (error) throw error;
        } catch (err) {
            setError(err.message);
        }
    };

    const shareTrip = async (tripId, email, accessLevel = 'read') => {
        try {
            const { error } = await supabase
                .from('trip_shares')
                .insert([{
                    trip_id: tripId,
                    shared_with_email: email,
                    access_level: accessLevel
                }]);

            if (error) throw error;
        } catch (err) {
            setError(err.message);
        }
    };

    return {
        trips,
        loading,
        error,
        createTrip,
        updateTrip,
        deleteTrip,
        shareTrip
    };
}; 