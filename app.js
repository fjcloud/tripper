// Récupérer React et ReactDOM depuis les variables globales
const { createElement, useState, useEffect } = React;
const root = ReactDOM.createRoot(document.getElementById('root'));

// Utilitaire pour créer les icônes
const createIcon = (iconName) => {
    return (props) => {
        const iconRef = React.useRef(null);
        
        useEffect(() => {
            if (iconRef.current) {
                while (iconRef.current.firstChild) {
                    iconRef.current.removeChild(iconRef.current.firstChild);
                }
                
                const svgString = feather.icons[iconName].toSvg({
                    ...props,
                    class: `feather-${iconName} ${props.className || ''}`
                });
                iconRef.current.innerHTML = svgString;
            }
            
            return () => {
                if (iconRef.current) {
                    while (iconRef.current.firstChild) {
                        iconRef.current.removeChild(iconRef.current.firstChild);
                    }
                }
            };
        }, [props.className]);
        
        return createElement('span', {
            ref: iconRef,
            ...props,
            className: `inline-block ${props.className || ''}`
        });
    };
};

// Création des icônes
const Icons = {
    Plus: createIcon('plus'),
    Download: createIcon('download'),
    X: createIcon('x'),
    Edit2: createIcon('edit-2'),
    Upload: createIcon('upload'),
    Clock: createIcon('clock'),
    Check: createIcon('check'),
    Trash2: createIcon('trash-2'),
    Settings: createIcon('settings'),
    Share2: createIcon('share-2'),
    ArrowLeft: createIcon('arrow-left')
};

// Fonction debounce pour l'autocomplétion
const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

// Utilitaire pour formater la durée
const formatDuration = (duration) => {
    if (!duration.days && !duration.hours && !duration.minutes) return '';
    
    const parts = [];
    if (duration.days) {
        parts.push(`${duration.days}j`);
    }
    if (duration.hours) {
        parts.push(`${duration.hours}h`);
    }
    if (duration.minutes) {
        parts.push(`${duration.minutes}min`);
    }
    return parts.join(' ');
};

const formatLinks = (links) => {
    if (!links) return null;
    
    const truncateUrl = (url) => {
        if (url.length <= 30) return url;
        return url.substring(0, 27) + '...';
    };

    return links.split(',').map((link, index) => {
        const trimmedLink = link.trim();
        // Add https:// if the link doesn't start with http:// or https://
        const fullLink = /^https?:\/\//i.test(trimmedLink) 
            ? trimmedLink 
            : `https://${trimmedLink}`;
            
        return (
            <React.Fragment key={index}>
                {index > 0 && ', '}
                <a 
                    href={fullLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-700 underline"
                    onClick={(e) => e.stopPropagation()}
                    title={fullLink} // Affiche l'URL complète au survol
                >
                    {truncateUrl(trimmedLink)}
                </a>
            </React.Fragment>
        );
    });
};

// Add this utility function near the other formatting functions
const formatBudget = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR'
    }).format(amount);
};

// Add this utility function for date formatting
const formatDate = (dateString) => {
    const date = new Date(dateString);
    const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    
    return {
        dayName: days[date.getDay()],
        day: date.getDate(),
        month: months[date.getMonth()],
        year: date.getFullYear(),
        dateObj: date
    };
};

// Add this utility function to group activities by date
const groupActivitiesByDate = (activities) => {
    const grouped = activities
        .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
        .reduce((groups, activity) => {
            const date = activity.startDate.split('T')[0]; // Get just the date part
            if (!groups[date]) {
                groups[date] = [];
            }
            groups[date].push(activity);
            return groups;
        }, {});
    
    return Object.entries(grouped).map(([date, activities]) => ({
        date: formatDate(date),
        activities
    }));
};

// Composant pour une activité individuelle
const ActivityCard = ({ activity, labels, onEdit, onDelete, onToggleStatus, expanded, onToggle }) => {
    return (
        <div 
            className={`flex-1 bg-white rounded-lg shadow ${activity.status === 'pending' ? 'border-l-4 border-yellow-500' : ''}`}
            onClick={onToggle}
        >
            <div className="p-3 cursor-pointer hover:bg-gray-50">
                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                    <div className="flex items-center space-x-2 flex-wrap">
                        <span 
                            className="inline-block px-2 py-1 rounded text-sm text-white"
                            style={{ backgroundColor: labels.find(l => l.name === activity.label)?.color || '#000' }}>
                            {activity.label}
                        </span>
                        {activity.status === 'pending' && (
                            <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                                À compléter
                            </span>
                        )}
                    </div>
                    <div className="flex space-x-2 sm:ml-auto" onClick={e => e.stopPropagation()}>
                        <button 
                            onClick={onToggleStatus}
                            className={`p-2 rounded ${
                                activity.status === 'pending' 
                                    ? 'text-yellow-500 hover:bg-yellow-100' 
                                    : 'text-green-500 hover:bg-green-100'
                            }`}>
                            {activity.status === 'pending' ? 
                                <Icons.Clock className="w-4 h-4" /> : 
                                <Icons.Check className="w-4 h-4" />
                            }
                        </button>
                        <button onClick={onEdit} className="p-2">
                            <Icons.Edit2 className="w-4 h-4 text-gray-500" />
                        </button>
                        <button onClick={onDelete} className="p-2">
                            <Icons.X className="w-4 h-4 text-red-500" />
                        </button>
                    </div>
                </div>
                <div className="mt-1">
                    <h3 className="font-bold">{activity.name}</h3>
                    <p className="text-gray-600 text-sm">{activity.location}</p>
                </div>
            </div>

            {expanded && (
                <div className="px-3 pb-3 border-t" onClick={e => e.stopPropagation()}>
                    <div className="mt-2 text-sm text-gray-600 space-y-1">
                        <p><span className="font-bold">Durée:</span> {formatDuration(activity.duration)}</p>
                        <p><span className="font-bold">Personnes:</span> {activity.people}</p>
                        <p><span className="font-bold">Budget:</span> {formatBudget(activity.budget)}</p>
                        {activity.notes && <p><span className="font-bold">Notes:</span> {activity.notes}</p>}
                        {activity.links && (
                            <p>
                                <span className="font-bold">Liens:</span>{' '}
                                {formatLinks(activity.links)}
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// Composant pour le formulaire d'activité
const ActivityForm = ({ formData, setFormData, labels, onSubmit, onClose, isEdit }) => {
    const [locationSuggestions, setLocationSuggestions] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    const searchLocation = async (query) => {
        if (query.length < 3) {
            setLocationSuggestions([]);
            return;
        }

        setIsSearching(true);
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`
            );
            const data = await response.json();
            setLocationSuggestions(data);
        } catch (error) {
            console.error('Erreur de recherche:', error);
        }
        setIsSearching(false);
    };

    const debouncedSearch = debounce(searchLocation, 300);

    const handleLocationSelect = (location) => {
        setFormData({
            ...formData,
            location: location.display_name,
            coordinates: {
                lat: location.lat,
                lng: location.lon
            }
        });
        setLocationSuggestions([]);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center modal-overlay">
            <div className="bg-white p-6 rounded-lg w-full max-w-lg modal-content">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">
                        {isEdit ? 'Modifier l\'activité' : 'Nouvelle activité'}
                    </h2>
                    <button onClick={onClose}>
                        <Icons.X className="w-6 h-6" />
                    </button>
                </div>
                <form onSubmit={onSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium">Nom</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={e => setFormData({...formData, name: e.target.value})}
                            className="mt-1 w-full border rounded p-2"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Label</label>
                        <select
                            value={formData.label}
                            onChange={e => setFormData({...formData, label: e.target.value})}
                            className="mt-1 w-full border rounded p-2"
                            required
                        >
                            <option value="">Sélectionner un label</option>
                            {labels.map((label, index) => (
                                <option key={index} value={label.name}>{label.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Localisation</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={formData.location}
                                onChange={(e) => {
                                    setFormData({...formData, location: e.target.value});
                                    debouncedSearch(e.target.value);
                                }}
                                className="mt-1 w-full border rounded p-2"
                                required
                                placeholder="Rechercher une adresse..."
                            />
                            {locationSuggestions.length > 0 && (
                                <div className="absolute z-10 w-full bg-white mt-1 border rounded-md shadow-lg">
                                    {locationSuggestions.map((suggestion, index) => (
                                        <div
                                            key={index}
                                            className="p-2 hover:bg-gray-100 cursor-pointer"
                                            onClick={() => handleLocationSelect(suggestion)}
                                        >
                                            {suggestion.display_name}
                                        </div>
                                    ))}
                                </div>
                            )}
                            {isSearching && (
                                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                                    <div className="spinner h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent"></div>
                                </div>
                            )}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Date de début</label>
                        <input
                            type="datetime-local"
                            value={formData.startDate}
                            onChange={e => setFormData({...formData, startDate: e.target.value})}
                            className="mt-1 w-full border rounded p-2"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Durée</label>
                        <div className="flex space-x-2">
                            <div className="flex-1">
                                <input
                                    type="number"
                                    min="0"
                                    max="30"
                                    value={formData.duration.days}
                                    onChange={e => setFormData({
                                        ...formData, 
                                        duration: {...formData.duration, days: e.target.value}
                                    })}
                                    className="mt-1 w-full border rounded p-2"
                                    placeholder="Jours"
                                />
                            </div>
                            <div className="flex-1">
                                <input
                                    type="number"
                                    min="0"
                                    max="23"
                                    value={formData.duration.hours}
                                    onChange={e => setFormData({
                                        ...formData, 
                                        duration: {...formData.duration, hours: e.target.value}
                                    })}
                                    className="mt-1 w-full border rounded p-2"
                                    placeholder="Heures"
                                />
                            </div>
                            <div className="flex-1">
                                <input
                                    type="number"
                                    min="0"
                                    max="59"
                                    value={formData.duration.minutes}
                                    onChange={e => setFormData({
                                        ...formData, 
                                        duration: {...formData.duration, minutes: e.target.value}
                                    })}
                                    className="mt-1 w-full border rounded p-2"
                                    placeholder="Minutes"
                                />
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Personnes</label>
                        <input
                            type="text"
                            value={formData.people}
                            onChange={e => setFormData({...formData, people: e.target.value})}
                            className="mt-1 w-full border rounded p-2"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Budget (€)</label>
                        <input
                            type="number"
                            value={formData.budget}
                            onChange={e => setFormData({...formData, budget: e.target.value})}
                            className="mt-1 w-full border rounded p-2"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Notes</label>
                        <textarea
                            value={formData.notes}
                            onChange={e => setFormData({...formData, notes: e.target.value})}
                            className="mt-1 w-full border rounded p-2"
                            rows="3"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Liens</label>
                        <input
                            type="text"
                            value={formData.links}
                            onChange={e => setFormData({...formData, links: e.target.value})}
                            className="mt-1 w-full border rounded p-2"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Statut</label>
                        <select
                            value={formData.status}
                            onChange={e => setFormData({...formData, status: e.target.value})}
                            className="mt-1 w-full border rounded p-2"
                        >
                            <option value="pending">À compléter</option>
                            <option value="completed">Complété</option>
                        </select>
                    </div>
                    <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded">
                        {isEdit ? 'Modifier' : 'Ajouter'}
                    </button>
                </form>
            </div>
        </div>
    );
};

// Composant pour le formulaire de label
const LabelForm = ({ labelForm, setLabelForm, onSubmit, onClose, isEdit }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center modal-overlay">
            <div className="bg-white p-6 rounded-lg w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">
                        {isEdit ? 'Modifier le Label' : 'Nouveau Label'}
                    </h2>
                    <button onClick={onClose}>
                        <Icons.X className="w-6 h-6" />
                    </button>
                </div>
                <form onSubmit={onSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium">Nom</label>
                        <input
                            type="text"
                            value={labelForm.name}
                            onChange={e => setLabelForm({...labelForm, name: e.target.value})}
                            className="mt-1 w-full border rounded p-2"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Couleur</label>
                        <input
                            type="color"
                            value={labelForm.color}
                            onChange={e => setLabelForm({...labelForm, color: e.target.value})}
                            className="mt-1 w-full h-10 border rounded cursor-pointer"
                            required
                        />
                    </div>
                    <button 
                        type="submit" 
                        className="w-full bg-blue-500 text-white py-2 rounded"
                    >
                        {isEdit ? 'Modifier' : 'Ajouter'}
                    </button>
                </form>
            </div>
        </div>
    );
};

// Ajouter un composant pour la gestion des labels
const LabelManager = ({ labels, onEditLabel, onDeleteLabel }) => {
    return (
        <div className="mt-4 space-y-2">
            <h3 className="font-medium text-gray-700">Labels existants</h3>
            <div className="grid grid-cols-1 gap-2">
                {labels.map((label, index) => (
                    <div 
                        key={index} 
                        className="flex items-center justify-between bg-white p-2 rounded border"
                    >
                        <div className="flex items-center space-x-2">
                            <div 
                                className="w-6 h-6 rounded"
                                style={{ backgroundColor: label.color }}
                            />
                            <span>{label.name}</span>
                        </div>
                        <div className="flex space-x-2">
                            <button 
                                onClick={() => onEditLabel(label)}
                                className="p-1 hover:bg-gray-100 rounded"
                            >
                                <Icons.Edit2 className="w-4 h-4 text-gray-600" />
                            </button>
                            <button 
                                onClick={() => onDeleteLabel(label)}
                                className="p-1 hover:bg-gray-100 rounded"
                            >
                                <Icons.Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Utility function to migrate activity data
const migrateActivityData = (activity) => {
    // Convert the old duration (string) to the new format
    if (typeof activity.duration === 'string') {
        const durationStr = activity.duration.toLowerCase();
        const duration = {
            days: '',
            hours: '',
            minutes: ''
        };

        // Extract days, hours and minutes from the old string
        const daysMatch = durationStr.match(/(\d+)\s*j/);
        const hoursMatch = durationStr.match(/(\d+)\s*h/);
        const minutesMatch = durationStr.match(/(\d+)\s*min/);

        if (daysMatch) duration.days = daysMatch[1];
        if (hoursMatch) duration.hours = hoursMatch[1];
        if (minutesMatch) duration.minutes = minutesMatch[1];

        // If no recognized format, put the value in hours
        if (!daysMatch && !hoursMatch && !minutesMatch && durationStr) {
            duration.hours = durationStr.replace(/[^0-9]/g, '');
        }

        activity.duration = duration;
    }

    // Add status if it doesn't exist
    if (!activity.status) {
        activity.status = 'pending';
    }

    // Add coordinates if they don't exist
    if (!activity.coordinates) {
        activity.coordinates = { lat: '', lng: '' };
    }

    return activity;
};

// Nouveau composant pour le volet des paramètres
const SettingsPanel = ({ 
    show, 
    onClose, 
    labels,
    onEditLabel,
    onDeleteLabel,
    onAddLabel,
    labelForm,
    setLabelForm,
    onSubmitLabel,
    currentLabel,
    setCurrentLabel,
    onExport,
    onImport
}) => {
    return (
        <div className={`fixed inset-y-0 right-0 w-96 bg-white shadow-lg transform transition-transform duration-300 ${show ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="h-full flex flex-col">
                <div className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold">Paramètres</h2>
                    <button onClick={onClose}>
                        <Icons.X className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {/* Section Import/Export */}
                    <div>
                        <h3 className="text-lg font-medium mb-4">Import/Export</h3>
                        <div className="space-y-2">
                            <button 
                                onClick={onExport}
                                className="w-full bg-gray-500 text-white px-4 py-2 rounded flex items-center justify-center"
                            >
                                <Icons.Download className="w-4 h-4 mr-2" /> Exporter JSON
                            </button>
                            <label className="w-full bg-purple-500 text-white px-4 py-2 rounded flex items-center justify-center cursor-pointer">
                                <Icons.Upload className="w-4 h-4 mr-2" /> Importer JSON
                                <input
                                    type="file"
                                    accept=".json"
                                    className="hidden"
                                    onChange={onImport}
                                />
                            </label>
                        </div>
                    </div>

                    {/* Section Labels */}
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium">Labels</h3>
                            <button 
                                onClick={onAddLabel}
                                className="bg-green-500 text-white px-3 py-1 rounded flex items-center text-sm"
                            >
                                <Icons.Plus className="w-4 h-4 mr-1" /> Nouveau
                            </button>
                        </div>
                        <div className="space-y-2">
                            {labels.map((label, index) => (
                                <div 
                                    key={index} 
                                    className="flex items-center justify-between bg-white p-2 rounded border"
                                >
                                    <div className="flex items-center space-x-2">
                                        <div 
                                            className="w-6 h-6 rounded"
                                            style={{ backgroundColor: label.color }}
                                        />
                                        <span>{label.name}</span>
                                    </div>
                                    <div className="flex space-x-2">
                                        <button 
                                            onClick={() => onEditLabel(label)}
                                            className="p-1 hover:bg-gray-100 rounded"
                                        >
                                            <Icons.Edit2 className="w-4 h-4 text-gray-600" />
                                        </button>
                                        <button 
                                            onClick={() => onDeleteLabel(label)}
                                            className="p-1 hover:bg-gray-100 rounded"
                                        >
                                            <Icons.Trash2 className="w-4 h-4 text-red-500" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal de label - ne s'affiche que si labelForm n'est pas null */}
            {labelForm !== null && (
                <LabelForm 
                    labelForm={labelForm}
                    setLabelForm={setLabelForm}
                    onSubmit={onSubmitLabel}
                    onClose={() => {
                        setLabelForm(null);
                        setCurrentLabel(null);
                    }}
                    isEdit={!!currentLabel}
                />
            )}
        </div>
    );
};

// Nouveau composant pour la liste des voyages
const TripsList = ({ onSelectTrip, onCreateTrip }) => {
    const { trips, loading, error, createTrip, deleteTrip, shareTrip } = useTrips();
    const [showShareModal, setShowShareModal] = useState(false);
    const [selectedTripForShare, setSelectedTripForShare] = useState(null);
    const [shareEmail, setShareEmail] = useState('');

    const handleCreateTrip = async () => {
        const name = prompt('Nom du voyage:');
        if (!name) return;

        const newTrip = await createTrip(name, {
            activities: [],
            labels: [
                { name: 'Voyage', color: '#FF9800' },
                { name: 'Hôtel', color: '#2196F3' },
                { name: 'Restaurant', color: '#4CAF50' },
                { name: 'Activité', color: '#9C27B0' }
            ]
        });

        if (newTrip) {
            onSelectTrip(newTrip.id);
        }
    };

    const handleShare = async (e) => {
        e.preventDefault();
        await shareTrip(selectedTripForShare, shareEmail);
        setShowShareModal(false);
        setShareEmail('');
        setSelectedTripForShare(null);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="spinner h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
            </div>
        );
    }

    if (error) {
        return <div className="text-red-500">Erreur: {error}</div>;
    }

    return (
        <div className="p-4 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Mes Voyages</h1>
                <button 
                    onClick={handleCreateTrip}
                    className="bg-blue-500 text-white px-4 py-2 rounded flex items-center"
                >
                    <Icons.Plus className="w-4 h-4 mr-2" /> Nouveau voyage
                </button>
            </div>

            <div className="space-y-4">
                {trips.map(trip => (
                    <div 
                        key={trip.id} 
                        className="bg-white rounded-lg shadow p-4"
                    >
                        <div className="flex justify-between items-start">
                            <div 
                                className="flex-1 cursor-pointer"
                                onClick={() => onSelectTrip(trip.id)}
                            >
                                <h2 className="text-xl font-bold hover:text-blue-500">{trip.name}</h2>
                                <p className="text-gray-500 text-sm">
                                    {new Date(trip.created_at).toLocaleDateString()}
                                </p>
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => {
                                        setSelectedTripForShare(trip.id);
                                        setShowShareModal(true);
                                    }}
                                    className="text-blue-500 hover:bg-blue-50 p-2 rounded"
                                >
                                    <Icons.Share2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => {
                                        if (confirm('Supprimer ce voyage ?')) {
                                            deleteTrip(trip.id);
                                        }
                                    }}
                                    className="text-red-500 hover:bg-red-50 p-2 rounded"
                                >
                                    <Icons.Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {showShareModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-lg w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Partager le voyage</h2>
                        <form onSubmit={handleShare} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium">Email</label>
                                <input
                                    type="email"
                                    value={shareEmail}
                                    onChange={e => setShareEmail(e.target.value)}
                                    className="mt-1 w-full border rounded p-2"
                                    required
                                />
                            </div>
                            <div className="flex justify-end space-x-2">
                                <button
                                    type="button"
                                    onClick={() => setShowShareModal(false)}
                                    className="px-4 py-2 text-gray-600"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="bg-blue-500 text-white px-4 py-2 rounded"
                                >
                                    Partager
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

// Modifier le TimelineApp pour utiliser Supabase
const TimelineApp = ({ tripId, onBack }) => {
    const { trip, loading, error } = useTrip(tripId);
    const [activities, setActivities] = useState([]);
    const [labels, setLabels] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [currentActivity, setCurrentActivity] = useState(null);
    const [currentLabel, setCurrentLabel] = useState(null);
    const [labelForm, setLabelForm] = useState(null);
    const [expandedActivities, setExpandedActivities] = useState(() => {
        const savedExpanded = localStorage.getItem(`timeline_expanded_${tripId}`);
        return new Set(savedExpanded ? JSON.parse(savedExpanded) : []);
    });
    const [collapsedDays, setCollapsedDays] = useState(() => {
        const savedCollapsed = localStorage.getItem(`timeline_collapsed_days_${tripId}`);
        return new Set(savedCollapsed ? JSON.parse(savedCollapsed) : []);
    });

    // Initialiser formData après avoir chargé les labels
    const [formData, setFormData] = useState(() => ({
        name: '',
        location: '',
        startDate: '',
        duration: { days: 0, hours: 0, minutes: 0 },
        people: '',
        budget: '',
        notes: '',
        links: '',
        label: '',  // On laisse vide pour l'instant
        status: 'pending'
    }));

    // Mettre à jour formData quand les labels changent
    useEffect(() => {
        if (labels.length > 0 && !formData.label) {
            setFormData(prev => ({
                ...prev,
                label: labels[0].name
            }));
        }
    }, [labels]);

    // Charger les données du voyage
    useEffect(() => {
        if (trip?.data) {
            setActivities(trip.data.activities || []);
            setLabels(trip.data.labels || []);
        }
    }, [trip]);

    // Sauvegarder les changements dans Supabase
    const saveChanges = async (newActivities, newLabels) => {
        try {
            const { error } = await supabase
                .from('trips')
                .update({
                    data: {
                        activities: newActivities,
                        labels: newLabels
                    }
                })
                .eq('id', tripId);

            if (error) throw error;
        } catch (err) {
            console.error('Erreur de sauvegarde:', err);
            alert('Erreur lors de la sauvegarde des modifications');
        }
    };

    // Mettre à jour les activités avec sauvegarde
    const updateActivities = (newActivities) => {
        setActivities(newActivities);
        saveChanges(newActivities, labels);
    };

    // Mettre à jour les labels avec sauvegarde
    const updateLabels = (newLabels) => {
        setLabels(newLabels);
        saveChanges(activities, newLabels);
    };

    const handleExport = () => {
        const dataStr = JSON.stringify(trip.data, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        const exportFileDefaultName = `${trip.name.toLowerCase().replace(/\s+/g, '-')}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    };

    const handleImport = async (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const importedData = JSON.parse(e.target.result);
                    
                    // Migrer les données si nécessaire
                    const migratedActivities = importedData.activities.map(migrateActivityData);
                    
                    // Sauvegarder les données importées
                    await saveChanges(migratedActivities, importedData.labels);
                    
                    // Mettre à jour l'état local
                    setActivities(migratedActivities);
                    setLabels(importedData.labels);
                    
                    alert('Import réussi !');
                } catch (error) {
                    alert('Erreur lors de l\'import : ' + error.message);
                }
            };
            reader.readAsText(file);
        }
        event.target.value = '';
    };

    const handleToggleDay = (dateString) => {
        const newCollapsed = new Set(collapsedDays);
        if (newCollapsed.has(dateString)) {
            newCollapsed.delete(dateString);
        } else {
            newCollapsed.add(dateString);
        }
        setCollapsedDays(newCollapsed);
    };

    const handleToggle = (activity) => {
        const index = activities.indexOf(activity);
        const newExpanded = new Set(expandedActivities);
        if (newExpanded.has(index)) {
            newExpanded.delete(index);
        } else {
            newExpanded.add(index);
        }
        setExpandedActivities(newExpanded);
    };

    const handleToggleStatus = (activity) => {
        const newActivities = activities.map(act => 
            act === activity 
                ? {...act, status: act.status === 'pending' ? 'completed' : 'pending'}
                : act
        );
        updateActivities(newActivities);
    };

    const handleEditActivity = (activity) => {
        setCurrentActivity(activity);
        setFormData(activity);
        setShowForm(true);
    };

    const handleDeleteActivity = (activity) => {
        if (confirm('Supprimer cette activité ?')) {
            const newActivities = activities.filter(a => a !== activity);
            updateActivities(newActivities);
        }
    };

    const handleSubmitActivity = (e) => {
        e.preventDefault();
        if (currentActivity) {
            const newActivities = activities.map(act => 
                act === currentActivity ? formData : act
            );
            updateActivities(newActivities);
        } else {
            updateActivities([...activities, formData]);
        }
        setShowForm(false);
    };

    const handleEditLabel = (label) => {
        setCurrentLabel(label);
        setLabelForm(label);
    };

    const handleDeleteLabel = (label) => {
        if (confirm('Supprimer ce label ?')) {
            const newLabels = labels.filter(l => l !== label);
            updateLabels(newLabels);
            
            // Mettre à jour les activités qui utilisaient ce label
            const newActivities = activities.map(activity => {
                if (activity.label === label.name) {
                    return { ...activity, label: newLabels[0]?.name || 'Autre' };
                }
                return activity;
            });
            updateActivities(newActivities);
        }
    };

    const handleSubmitLabel = (e) => {
        e.preventDefault();
        if (currentLabel) {
            // Édition d'un label existant
            const newLabels = labels.map(label => 
                label === currentLabel ? labelForm : label
            );
            updateLabels(newLabels);
            
            // Mettre à jour les activités qui utilisaient l'ancien nom
            if (currentLabel.name !== labelForm.name) {
                const newActivities = activities.map(activity => {
                    if (activity.label === currentLabel.name) {
                        return { ...activity, label: labelForm.name };
                    }
                    return activity;
                });
                updateActivities(newActivities);
            }
        } else {
            // Création d'un nouveau label
            updateLabels([...labels, labelForm]);
        }
        setCurrentLabel(null);
        setLabelForm(null);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="spinner h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
            </div>
        );
    }

    if (error) {
        return <div className="text-red-500">Erreur: {error}</div>;
    }

    return (
        <div className="p-2 sm:p-4 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
                <div className="w-full sm:w-auto space-y-2">
                    <div className="flex items-center space-x-4">
                        <button 
                            onClick={onBack}
                            className="text-gray-600 hover:text-gray-800"
                        >
                            <Icons.ArrowLeft className="w-6 h-6" />
                        </button>
                        <h1 className="text-xl sm:text-2xl font-bold truncate">{trip.name}</h1>
                    </div>
                    <div className="text-base sm:text-lg text-gray-600">
                        Budget total: <span className="font-semibold">
                            {formatBudget(activities.reduce((sum, activity) => sum + (parseFloat(activity.budget) || 0), 0))}
                        </span>
                    </div>
                </div>
                <div className="w-full sm:w-auto flex space-x-2">
                    <button 
                        onClick={() => setShowForm(true)}
                        className="flex-1 sm:flex-none bg-blue-500 text-white px-4 py-2 rounded flex items-center justify-center"
                    >
                        <Icons.Plus className="w-4 h-4 mr-2" /> Activité
                    </button>
                    <button 
                        onClick={() => setShowSettings(true)}
                        className="flex-1 sm:flex-none bg-gray-500 text-white px-4 py-2 rounded flex items-center justify-center"
                    >
                        <Icons.Settings className="w-4 h-4 mr-2" /> Paramètres
                    </button>
                </div>
            </div>

            {/* Timeline */}
            <div className="space-y-6">
                {groupActivitiesByDate(activities).map(({ date, activities: groupedActivities }, groupIndex) => {
                    const dateString = `${date.year}-${date.month}-${date.day}`;
                    const isCollapsed = collapsedDays.has(dateString);

                    return (
                        <div key={groupIndex} className="relative">
                            <div 
                                className="sm:sticky sm:top-4 w-full sm:w-40 sm:float-left sm:pr-4 mb-2 sm:mb-0"
                                onClick={() => handleToggleDay(dateString)}
                            >
                                <div className="bg-white sm:bg-transparent p-2 sm:p-0 rounded-lg shadow sm:shadow-none cursor-pointer">
                                    <div className="flex sm:block items-center justify-between text-gray-500 hover:text-gray-700">
                                        <div className="font-medium">
                                            <span>{date.dayName}</span>
                                        </div>
                                        <div className="flex sm:block items-center space-x-2 sm:space-x-0">
                                            <span>{date.day} {date.month}</span>
                                            <span className="text-sm">{date.year}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="sm:ml-40 space-y-4">
                                {isCollapsed ? (
                                    <div className="bg-white rounded-lg shadow p-3">
                                        <div className="flex flex-wrap gap-2">
                                            {groupedActivities.map((activity, index) => (
                                                <span
                                                    key={index}
                                                    className="inline-flex items-center space-x-1 px-2 py-1 rounded text-sm"
                                                    style={{ 
                                                        backgroundColor: labels.find(l => l.name === activity.label)?.color + '20',
                                                        color: labels.find(l => l.name === activity.label)?.color
                                                    }}
                                                >
                                                    <span>{activity.name}</span>
                                                    {activity.status === 'pending' && (
                                                        <Icons.Clock className="w-3 h-3" />
                                                    )}
                                                </span>
                                            ))}
                                        </div>
                                        <div className="mt-2 text-sm text-gray-500">
                                            Budget total: {formatBudget(
                                                groupedActivities.reduce((sum, activity) => sum + (parseFloat(activity.budget) || 0), 0)
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    groupedActivities.map((activity, index) => (
                                        <ActivityCard 
                                            key={index}
                                            activity={activity}
                                            labels={labels}
                                            onEdit={() => handleEditActivity(activity)}
                                            onDelete={() => handleDeleteActivity(activity)}
                                            onToggleStatus={() => handleToggleStatus(activity)}
                                            expanded={expandedActivities.has(activities.indexOf(activity))}
                                            onToggle={() => handleToggle(activity)}
                                        />
                                    ))
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Formulaire d'activité */}
            {showForm && (
                <ActivityForm 
                    formData={formData}
                    setFormData={setFormData}
                    labels={labels}
                    onSubmit={handleSubmitActivity}
                    onClose={() => setShowForm(false)}
                    isEdit={currentActivity}
                />
            )}

            {/* Volet des paramètres */}
            <SettingsPanel 
                show={showSettings}
                onClose={() => setShowSettings(false)}
                labels={labels}
                onEditLabel={handleEditLabel}
                onDeleteLabel={handleDeleteLabel}
                onAddLabel={() => {
                    setLabelForm({ name: '', color: '#000000' });
                    setCurrentLabel(null);
                }}
                labelForm={labelForm}
                setLabelForm={setLabelForm}
                onSubmitLabel={handleSubmitLabel}
                currentLabel={currentLabel}
                setCurrentLabel={setCurrentLabel}
                onExport={handleExport}
                onImport={handleImport}
            />
        </div>
    );
};

// Modifier le composant principal
const App = () => {
    const [currentTripId, setCurrentTripId] = useState(null);

    if (!currentTripId) {
        return <TripsList onSelectTrip={setCurrentTripId} />;
    }

    return <TimelineApp tripId={currentTripId} onBack={() => setCurrentTripId(null)} />;
};

// Rendu de l'application
root.render(
    createElement(AuthProvider, null,
        createElement(App)
    )
);