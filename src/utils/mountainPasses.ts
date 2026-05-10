/**
 * Mountain Pass Status API utilities
 * Fetches real-time data from various sources
 */

export interface MountainPass {
  id: string;
  name: string;
  altitude: number;
  region: string;
  status: 'OPEN' | 'CLOSED' | 'PARTIAL' | 'ALERT';
  direction?: 'UP' | 'DOWN' | 'BOTH';
  conditions?: string[];
  updated?: Date;
  source?: string;
  coordinates?: [number, number]; // [latitude, longitude]
}

/**
 * Status mapping for different APIs
 * 0: CLOSED, 1: PARTIAL/ALERT, 2: OPEN
 */
const STATUS_MAP: Record<number, 'OPEN' | 'CLOSED' | 'PARTIAL' | 'ALERT'> = {
  0: 'CLOSED',
  1: 'ALERT',
  2: 'OPEN'
};

/**
 * Approximate altitudes for Savoie Route passes
 * These are estimated from common knowledge - ideally would come from elevation API
 */
const PASS_ALTITUDES: Record<string, number> = {
  'Col de la Crusille': 1322,
  'Col de Plainpalais': 1336,
  'Col du Mollard': 1641,
  'Col des Saisies': 1633,
  'Col du Frêne': 1370,
  'Col de la Forclaz de Queige': 1193,
  'Col des Prés': 1566,
  'Col du Télégraphe': 1566,
  'Col de Tamié': 907,
  'Col de Couz': 922,
  'Col de Cessens': 1366,
  'Col du Granier': 1134,
  'Col de la Cluse': 1019,
  'Col du Banchet': 1278,
  'Col du Grand Cucheron': 1188,
  'Col de Marocaz': 1236,
  'Col de la Chambotte': 1235,
  'Col du Chat': 924,
  'Col de la Madeleine (Lanslevillard)': 1993,
  'Col du Petit Saint Bernard': 2188,
  'Col de l\'Iseran': 2764,
  'Tunnel du Galibier': 1641,
  'Col d\'Albanne': 1657,
  'Col de l\'Épine': 1456,
  'Col de la Forclaz (Montmin)': 1157,
  'Col de la Forclaz de Montmin': 1157,
  'Petit Mont Cenis': 1188,
  'Mont Cenis': 2081,
  'Col de la Sestriere': 2035,
  'Col Agnel': 2748,
  'Colle Finestra': 2278,
  'Colle dell\'Agnello': 2744,
  'Gavia Pass': 2621,
  'Passo del Tonale': 1883,
};

/**
 * Fetch mountain pass data from Savoie Route API
 */
export async function fetchSavoieRoutePasses(): Promise<MountainPass[]> {
  try {
    const response = await fetch('https://savoie-route.fr/api/v1/evenements/carto', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id: 5 })
    });

    if (!response.ok) {
      console.error('Savoie Route API error:', response.status);
      return [];
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      console.error('Unexpected API response format');
      return [];
    }

    // Map Savoie Route data to MountainPass format
    return data.map((pass: any) => {
      const passName = pass.FRLabel || 'Unknown Pass';
      return {
        id: `savoie-${pass.idtInfo}`,
        name: passName,
        altitude: pass.altitude || PASS_ALTITUDES[passName] || 0,
        region: 'Alpes - Savoie',
        status: STATUS_MAP[pass.Etat] || 'ALERT',
        updated: new Date(),
        source: 'savoie-route.fr',
        coordinates: [pass.latitude, pass.longitude] as [number, number]
      };
    });
  } catch (error) {
    console.error('Failed to fetch Savoie Route passes:', error);
    return [];
  }
}

/**
 * Status mapping for Hautes-Alpes API
 * "OUVERT" = OPEN, "FERME" = CLOSED
 */
const HAUTES_ALPES_STATUS_MAP: Record<string, 'OPEN' | 'CLOSED' | 'PARTIAL' | 'ALERT'> = {
  'OUVERT': 'OPEN',
  'FERME': 'CLOSED',
};

/**
 * Status mapping for Inforoute06 API
 * Based on code property (e.g., "C14 Ouvert") or url_icone
 */
const INFOROUTE06_STATUS_MAP: Record<string, 'OPEN' | 'CLOSED' | 'PARTIAL' | 'ALERT'> = {
  'ouvert': 'OPEN',
  'open': 'OPEN',
  'fermé': 'CLOSED',
  'ferme': 'CLOSED',
  'closed': 'CLOSED',
  'alerte': 'ALERT',
  'alert': 'ALERT',
  'partial': 'PARTIAL',
  'partiel': 'PARTIAL',
};

/**
 * Fetch mountain pass data from Hautes-Alpes API
 * API endpoint returns GeoJSON FeatureCollection
 */
export async function fetchHautesAlpesPasses(): Promise<MountainPass[]> {
  try {
    const response = await fetch('https://inforoute.hautes-alpes.fr/ws/geojson/fr/col/TODAY');

    if (!response.ok) {
      console.error('Hautes-Alpes API error:', response.status);
      return [];
    }

    const data = await response.json();

    if (!data.features || !Array.isArray(data.features)) {
      console.error('Unexpected Hautes-Alpes API response format');
      return [];
    }

    // Map Hautes-Alpes GeoJSON data to MountainPass format
    return data.features.map((feature: any) => {
      const properties = feature;
      const [lon, lat] = feature.geometry?.coordinates || [0, 0];
      
      return {
        id: `hautes-alpes-${properties.nomCol?.replace(/\s+/g, '-').toLowerCase()}`,
        name: properties.nomCol || 'Unknown Pass',
        altitude: properties.altitude || 0,
        region: `Hautes-Alpes - ${properties.nomZone || 'Unknown'}`,
        status: HAUTES_ALPES_STATUS_MAP[properties.etatCol] || 'ALERT',
        updated: new Date(),
        source: 'inforoute.hautes-alpes.fr',
        coordinates: [lat, lon] as [number, number]
      };
    });
  } catch (error) {
    console.error('Failed to fetch Hautes-Alpes passes:', error);
    return [];
  }
}

/**
 * Fetch mountain pass data from Inforoute06 API
 * API endpoint returns GeoJSON FeatureCollection via POST request
 */
export async function fetchInforoute06Passes(): Promise<MountainPass[]> {
  try {
    const formData = new URLSearchParams();
    formData.append('action', '374');
    formData.append('protect', '1');

    const response = await fetch('https://www.inforoutes06.fr/mod_turbolead/mod/inforoute/index.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString()
    });

    if (!response.ok) {
      console.error('Inforoute06 API error:', response.status);
      return [];
    }

    const data = await response.json();

    if (!data.features || !Array.isArray(data.features)) {
      console.error('Unexpected Inforoute06 API response format');
      return [];
    }

    // Map Inforoute06 GeoJSON data to MountainPass format
    return data.features
      .filter((feature: any) => feature.properties?.titre?.toLowerCase().includes('col'))
      .map((feature: any) => {
        const properties = feature.properties || {};
        const [lon, lat] = feature.geometry?.coordinates || [0, 0];
        
        // Parse status from code (e.g., "C14 Ouvert") or url_icone
        let status: 'OPEN' | 'CLOSED' | 'PARTIAL' | 'ALERT' = 'ALERT';
        const codeStr = properties.code?.toLowerCase() || '';
        const iconUrl = properties.url_icone?.toLowerCase() || '';
        
        // Try to match status from code property
        for (const [key, value] of Object.entries(INFOROUTE06_STATUS_MAP)) {
          if (codeStr.includes(key) || iconUrl.includes(key)) {
            status = value;
            break;
          }
        }
        
        return {
          id: `inforoute06-${properties.titre?.replace(/\s+/g, '-').toLowerCase()}`,
          name: properties.titre || 'Unknown Pass',
          altitude: properties.altitude || 0,
          region: `Alpes-Maritimes - Inforoute06`,
          status: status,
          conditions: properties.code ? [properties.code] : undefined,
          updated: new Date(),
          source: 'inforoutes06.fr',
          coordinates: [lat, lon] as [number, number]
        };
      });
  } catch (error) {
    console.error('Failed to fetch Inforoute06 passes:', error);
    return [];
  }
}

/**
 * Fetch mountain pass data from Inforoute74 API
 * API endpoint returns GeoJSON FeatureCollection via POST request (similar to Inforoute06)
 */
export async function fetchInforoute74Passes(): Promise<MountainPass[]> {
  try {
    const formData = new URLSearchParams();
    formData.append('action', '374');
    formData.append('protect', '1');

    const response = await fetch('https://www.inforoute74.fr/mod_turbolead/mod/inforoute/index.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString()
    });

    if (!response.ok) {
      console.error('Inforoute74 API error:', response.status);
      return [];
    }

    const data = await response.json();

    if (!data.features || !Array.isArray(data.features)) {
      console.error('Unexpected Inforoute74 API response format');
      return [];
    }

    // Map Inforoute74 GeoJSON data to MountainPass format
    return data.features
      .filter((feature: any) => feature.properties?.titre?.toLowerCase().includes('col'))
      .map((feature: any) => {
        const properties = feature.properties || {};
        const [lon, lat] = feature.geometry?.coordinates || [0, 0];
        
        // Parse status from code (e.g., "C14 Ouvert") or url_icone
        let status: 'OPEN' | 'CLOSED' | 'PARTIAL' | 'ALERT' = 'ALERT';
        const codeStr = properties.code?.toLowerCase() || '';
        const iconUrl = properties.url_icone?.toLowerCase() || '';
        
        // Try to match status from code property
        for (const [key, value] of Object.entries(INFOROUTE06_STATUS_MAP)) {
          if (codeStr.includes(key) || iconUrl.includes(key)) {
            status = value;
            break;
          }
        }
        
        return {
          id: `inforoute74-${properties.titre?.replace(/\s+/g, '-').toLowerCase()}`,
          name: properties.titre || 'Unknown Pass',
          altitude: properties.altitude || 0,
          region: `Haute-Savoie - Inforoute74`,
          status: status,
          conditions: properties.code ? [properties.code] : undefined,
          updated: new Date(),
          source: 'inforoute74.fr',
          coordinates: [lat, lon] as [number, number]
        };
      });
  } catch (error) {
    console.error('Failed to fetch Inforoute74 passes:', error);
    return [];
  }
}
export async function getAllMountainPasses(): Promise<MountainPass[]> {
  try {
    const passes = await Promise.all([
      fetchSavoieRoutePasses(),
      fetchHautesAlpesPasses(),
      fetchInforoute06Passes(),
      fetchInforoute74Passes(),
    ]);

    return passes.flat().sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error('Failed to fetch mountain passes:', error);
    return [];
  }
}

/**
 * Filter passes by region
 */
export function filterByRegion(passes: MountainPass[], region: string): MountainPass[] {
  if (region === 'ALL') return passes;
  return passes.filter(pass => pass.region.includes(region));
}

/**
 * Filter passes by status
 */
export function filterByStatus(passes: MountainPass[], status: string): MountainPass[] {
  if (status === 'ALL') return passes;
  return passes.filter(pass => pass.status === status);
}
