window.useTrip = (tripId) => {
    const [trip, setTrip] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let isSubscribed = true;  // Pour éviter les mises à jour si le composant est démonté

        const fetchTrip = async () => {
            if (!isSubscribed) return;
            
            try {
                // Récupérer uniquement le voyage
                const { data: tripData, error: tripError } = await supabase
                    .from('trips')
                    .select('id, name, created_at, owner_id, data')  // Spécifier explicitement les colonnes
                    .eq('id', tripId)
                    .single();

                if (tripError) throw tripError;

                // Récupérer l'email de l'utilisateur courant
                const { data: { user } } = await supabase.auth.getUser();
                
                if (!isSubscribed) return;

                // Récupérer les informations de partage si l'utilisateur n'est pas le propriétaire
                if (tripData.owner_id !== user.id) {
                    const { data: shareData } = await supabase
                        .from('trip_shares')
                        .select('access_level')
                        .eq('trip_id', tripId)
                        .eq('shared_with_email', user.email)
                        .single();

                    if (!isSubscribed) return;
                    
                    setTrip({
                        ...tripData,
                        share_info: shareData
                    });
                } else {
                    setTrip(tripData);
                }
            } catch (err) {
                console.error('Erreur lors de la récupération du voyage:', err);
                if (isSubscribed) {
                    setError(err.message);
                }
            } finally {
                if (isSubscribed) {
                    setLoading(false);
                }
            }
        };

        fetchTrip();

        // Souscrire aux changements
        const tripSubscription = supabase
            .channel(`trips:${tripId}`)
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'trips',
                filter: `id=eq.${tripId}`
            }, async (payload) => {
                if (isSubscribed && payload.new) {
                    await fetchTrip();
                }
            })
            .subscribe();

        // Cleanup
        return () => {
            isSubscribed = false;
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