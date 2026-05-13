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
  department?: string; // two-digit department code, e.g. '73'
  country?: string;   // e.g. 'France', 'Italie'
  massif?: string;    // e.g. 'Alpes du Nord', 'Pyrénées', 'Dolomites'
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

function mapSavoieStatus(value: unknown): 'OPEN' | 'CLOSED' | 'PARTIAL' | 'ALERT' {
  const raw = String(value ?? '').trim().toLowerCase();
  if (raw.includes('ferm')) return 'CLOSED';
  if (raw.includes('partiel')) return 'PARTIAL';
  if (raw.includes('ouvert')) return 'OPEN';
  return 'ALERT';
}

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
  'Gavia Pass': 2618,
  'Passo del Tonale': 1883,
  'Passo Furcia': 1759,
  'Passo Lavazé': 1805,
  'Passo Nigra': 1367,
  'Passo Falzarego': 2105,
  'Passo Monte Croce Comelico': 1636,
  'Passo Palade': 1512,
  'Passo Stalle': 2052,
  'di Val d\'Ega e Passo Costalunga': 1745,
  'Passo Pordoi': 2239,
  'Passo Mendola': 1662,
  'del Passo di Giovo': 2093,
  'Passo dello Stelvio': 2758,
  'Passo del Rombo': 2474,
  'Passo Valparola': 2168,
  'Passo Erbe': 1887,
  'Passo Sella': 2218,
  'del Passo Gardena': 2136,
  'Passo Campolongo': 1875
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

    const detailedPasses = await Promise.all(
      data.map(async (pass: any) => {
        const idAll = pass?.idtInfo;
        if (!idAll) {
          return pass;
        }

        try {
          const detailResponse = await fetch('https://savoie-route.fr/api/v1/evenements/allDataCarto', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ idAll })
          });

          if (!detailResponse.ok) {
            console.error(`Savoie Route detail API error for idAll=${idAll}:`, detailResponse.status);
            return pass;
          }

          const detailData = await detailResponse.json();
          if (Array.isArray(detailData) && detailData.length > 0) {
            return detailData[0];
          }
          return pass;
        } catch (detailError) {
          console.error(`Failed to fetch Savoie Route detail for idAll=${idAll}:`, detailError);
          return pass;
        }
      })
    );

    return detailedPasses.map((pass: any) => {
      const passName = pass.FRLabel || pass.Label || 'Unknown Pass';
      const rawStatus = pass.FREtat ?? pass.ENEtat ?? pass.Etat;

      return {
        id: `savoie-${pass.idtInfo ?? pass.ID ?? pass.id ?? passName.replace(/\s+/g, '-').toLowerCase()}`,
        name: passName,
        altitude: pass.Altitude || 0,
        region: 'Alpes - Savoie',
        department: '73',
        status: mapSavoieStatus(rawStatus),
        updated: pass.maj ? new Date(pass.maj) : new Date(),
        source: 'savoie-route.fr',
        country: 'France',
        massif: 'Alpes du Nord',
        coordinates: [pass.Latitude ?? pass.latitude ?? 0, pass.Longitude ?? pass.longitude ?? 0] as [number, number]
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
        department: '05',
        status: HAUTES_ALPES_STATUS_MAP[properties.etatCol] || 'ALERT',
        updated: new Date(),
        source: 'inforoute.hautes-alpes.fr',
        country: 'France',
        massif: 'Alpes du Sud',
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
      .filter((feature: any) => {
        const properties = feature.properties || {};
        const titre = (properties.titre || '').toLowerCase();
        const code = (properties.code || '').toUpperCase();
        return titre.includes('col') && code.startsWith('C');
      })
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
          altitude: ((): number => {
            if (properties.altitude) {
              const n = Number(String(properties.altitude).replace(/[^\d.-]/g, ''));
              if (!Number.isNaN(n)) return n;
            }

            const title = properties.titre || '';
            // Try patterns like "- 810m" or "810 m"
            const match = title.match(/-\s*([\d\s,.]+)m/i) || title.match(/([\d\s,.]+)m/i);
            if (match && match[1]) {
              const cleaned = match[1].replace(/[^\d]/g, '');
              const parsed = parseInt(cleaned, 10);
              if (!Number.isNaN(parsed)) return parsed;
            }

            return 0;
          })(),
          region: `Alpes-Maritimes`,
          department: '06',
          status: status,
        //   conditions: properties.code ? [properties.code] : undefined,
          updated: new Date(),
          source: 'inforoutes06.fr',
          country: 'France',
          massif: 'Alpes du Sud',
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
      .filter((feature: any) => {
        const properties = feature.properties || {};
        const titre = (properties.titre || '').toLowerCase();
        const code = (properties.code || '').toUpperCase();
        return titre.includes('col ') && code.startsWith('C');
      })
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
          // Parse altitude from properties.altitude if present, otherwise try to extract from the title
          altitude: ((): number => {
            if (properties.altitude) {
              const n = Number(String(properties.altitude).replace(/[^\d.-]/g, ''));
              if (!Number.isNaN(n)) return n;
            }

            const title = properties.titre || '';
            // Try patterns like "- 810m" or "810 m"
            const match = title.match(/-\s*([\d\s,.]+)m/i) || title.match(/([\d\s,.]+)m/i);
            if (match && match[1]) {
              const cleaned = match[1].replace(/[^\d]/g, '');
              const parsed = parseInt(cleaned, 10);
              if (!Number.isNaN(parsed)) return parsed;
            }

            return 0;
          })(),
          region: `Haute-Savoie`,
          department: '74',
          status: status,
        //   conditions: properties.code ? [properties.code] : undefined,
          updated: new Date(),
          source: 'inforoute74.fr',
          country: 'France',
          massif: 'Alpes du Nord',
          coordinates: [lat, lon] as [number, number]
        };
      });
  } catch (error) {
    console.error('Failed to fetch Inforoute74 passes:', error);
    return [];
  }
}
export async function fetchInforoute04Passes(): Promise<MountainPass[]> {
  try {
    const formData = new URLSearchParams();
    formData.append('action', '374');
    formData.append('protect', '1');

    const response = await fetch('https://www.inforoute04.fr/mod_turbolead/mod/inforoute/index.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString()
    });

    if (!response.ok) {
      console.error('Inforoute04 API error:', response.status);
      return [];
    }

    const data = await response.json();

    if (!data.features || !Array.isArray(data.features)) {
      console.error('Unexpected Inforoute04 API response format');
      return [];
    }

    // Map Inforoute04 GeoJSON data to MountainPass format
    return data.features
      .filter((feature: any) => {
        const properties = feature.properties || {};
        const titre = (properties.titre || '').toLowerCase();
        const code = (properties.code || '').toUpperCase();
        return titre.includes('col ') && code.startsWith('C');
      })
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
          id: `inforoute04-${properties.titre?.replace(/\s+/g, '-').toLowerCase()}`,
          name: properties.titre || 'Unknown Pass',
          // Parse altitude from properties.altitude if present, otherwise try to extract from the title
          altitude: ((): number => {
            if (properties.altitude) {
              const n = Number(String(properties.altitude).replace(/[^\d.-]/g, ''));
              if (!Number.isNaN(n)) return n;
            }

            const title = properties.titre || '';
            // Try patterns like "- 810m" or "810 m"
            const match = title.match(/-\s*([\d\s,.]+)m/i) || title.match(/([\d\s,.]+)m/i);
            if (match && match[1]) {
              const cleaned = match[1].replace(/[^\d]/g, '');
              const parsed = parseInt(cleaned, 10);
              if (!Number.isNaN(parsed)) return parsed;
            }

            return 0;
          })(),
          region: `Alpes-de-Haute-Provence`,
          department: '04',
          status: status,
        //   conditions: properties.code ? [properties.code] : undefined,
          updated: new Date(),
          source: 'inforoute04.fr',
          country: 'France',
          massif: 'Alpes du Sud',
          coordinates: [lat, lon] as [number, number]
        };
      });
  } catch (error) {
    console.error('Failed to fetch Inforoute04 passes:', error);
    return [];
  }
}

export async function fetchInforouteLE64Passes(): Promise<MountainPass[]> {
  try {
    const formData = new URLSearchParams();
    formData.append('action', '374');
    formData.append('protect', '1');

    const targetUrl = 'https://inforoute.le64.fr/mod_turbolead/mod/inforoute/index.php?action=374&protect=1';
    const url = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'X-Requested-With': 'XMLHttpRequest',
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36',
        'Accept-Encoding': 'gzip, deflate, br'
      }
    });

    console.log('Fetching Inforoute64 passes, response status:', response.status);

    const text = await response.text();
    if (!response.ok) {
      console.error('Inforoute64 API error:', response.status, 'response:', String(text).slice(0, 2000));
      return [];
    }

    let data: any;
    try {
      data = JSON.parse(text);
    } catch (err) {
      console.error('Inforoute64 JSON parse error:', err, 'responseText:', String(text).slice(0, 2000));
      return [];
    }

    if (!data.features || !Array.isArray(data.features)) {
      console.error('Unexpected Inforoute64 API response format:', Object.keys(data || {}).slice(0, 20), 'sample:', String(text).slice(0, 2000));
      return [];
    }

    return data.features
      .filter((feature: any) => {
        const properties = feature.properties || {};
        const titre = (properties.titre || '').toLowerCase();
        const code = (properties.code || '').toUpperCase();
        return titre.includes('col ') && code.startsWith('C');
      })
      .map((feature: any) => {
        const properties = feature.properties || {};
        const [lon, lat] = feature.geometry?.coordinates || [0, 0];

        let status: 'OPEN' | 'CLOSED' | 'PARTIAL' | 'ALERT' = 'ALERT';
        const codeStr = properties.code?.toLowerCase() || '';
        const iconUrl = properties.url_icone?.toLowerCase() || '';

        for (const [key, value] of Object.entries(INFOROUTE06_STATUS_MAP)) {
          if (codeStr.includes(key) || iconUrl.includes(key)) {
            status = value;
            break;
          }
        }

        return {
          id: `inforoute64-${properties.titre?.replace(/\s+/g, '-').toLowerCase()}`,
          name: properties.titre || 'Unknown Pass',
          // Parse altitude from properties.altitude if present, otherwise try to extract from the title
          altitude: ((): number => {
            if (properties.altitude) {
              const n = Number(String(properties.altitude).replace(/[^\d.-]/g, ''));
              if (!Number.isNaN(n)) return n;
            }

            const title = properties.titre || '';
            const match = title.match(/-\s*([\d\s,.]+)m/i) || title.match(/([\d\s,.]+)m/i);
            if (match && match[1]) {
              const cleaned = match[1].replace(/[^\d]/g, '');
              const parsed = parseInt(cleaned, 10);
              if (!Number.isNaN(parsed)) return parsed;
            }

            return 0;
          })(),
          region: `Pyrénées-Atlantiques`,
          department: '64',
          status: status,
          updated: new Date(),
          source: 'inforoute.le64.fr',
          country: 'France',
          massif: 'Pyrénées',
          coordinates: [lat, lon] as [number, number]
        };
      });
  } catch (error) {
    console.error('Failed to fetch Inforoute64 passes:', error);
    return [];
  }
}
 
export async function fetchInforoute66Passes(): Promise<MountainPass[]> {
  try {
    const formData = new URLSearchParams();
    formData.append('action', '374');
    formData.append('protect', '1');

    const response = await fetch('https://www.inforoute66.fr/mod_turbolead/mod/inforoute/index.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString()
    });

    if (!response.ok) {
      console.error('Inforoute66 API error:', response.status);
      return [];
    }

    const data = await response.json();

    if (!data.features || !Array.isArray(data.features)) {
      console.error('Unexpected Inforoute66 API response format');
      return [];
    }

    return data.features
      .filter((feature: any) => {
        const properties = feature.properties || {};
        const titre = (properties.titre || '').toLowerCase();
        const code = (properties.code || '').toUpperCase();
        return titre.includes('col ') && code.startsWith('C');
      })
      .map((feature: any) => {
        const properties = feature.properties || {};
        const [lon, lat] = feature.geometry?.coordinates || [0, 0];

        let status: 'OPEN' | 'CLOSED' | 'PARTIAL' | 'ALERT' = 'ALERT';
        const codeStr = properties.code?.toLowerCase() || '';
        const iconUrl = properties.url_icone?.toLowerCase() || '';

        for (const [key, value] of Object.entries(INFOROUTE06_STATUS_MAP)) {
          if (codeStr.includes(key) || iconUrl.includes(key)) {
            status = value;
            break;
          }
        }

        return {
          id: `inforoute66-${properties.titre?.replace(/\s+/g, '-').toLowerCase()}`,
          name: properties.titre || 'Unknown Pass',
          altitude: ((): number => {
            if (properties.altitude) {
              const n = Number(String(properties.altitude).replace(/[^\d.-]/g, ''));
              if (!Number.isNaN(n)) return n;
            }

            const title = properties.titre || '';
            const match = title.match(/-\s*([\d\s,.]+)m/i) || title.match(/([\d\s,.]+)m/i);
            if (match && match[1]) {
              const cleaned = match[1].replace(/[^\d]/g, '');
              const parsed = parseInt(cleaned, 10);
              if (!Number.isNaN(parsed)) return parsed;
            }

            for (const [k, v] of Object.entries(PASS_ALTITUDES)) {
              if (String(properties.titre || '').toLowerCase().includes(String(k).toLowerCase())) return v;
            }
            return 0;
          })(),
          region: `Pyrénées-Orientales`,
          department: '66',
          status: status,
          updated: new Date(),
          source: 'inforoute66.fr',
          country: 'France',
          massif: 'Pyrénées',
          coordinates: [lat, lon] as [number, number]
        };
      });
  } catch (error) {
    console.error('Failed to fetch Inforoute66 passes:', error);
    return [];
  }
}
export async function fetchInforoute09Passes(): Promise<MountainPass[]> {
  try {
    const formData = new URLSearchParams();
    formData.append('action', '374');
    formData.append('protect', '1');

    const response = await fetch('https://www.inforoute09.fr/mod_turbolead/mod/inforoute/index.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString()
    });

    if (!response.ok) {
      console.error('Inforoute09 API error:', response.status);
      return [];
    }

    const data = await response.json();

    if (!data.features || !Array.isArray(data.features)) {
      console.error('Unexpected Inforoute09 API response format');
      return [];
    }

    return data.features
      .filter((feature: any) => {
        const properties = feature.properties || {};
        const titre = (properties.titre || '').toLowerCase();
        const code = (properties.code || '').toUpperCase();
        return titre.includes('col ') && code.startsWith('C');
      })
      .map((feature: any) => {
        const properties = feature.properties || {};
        const [lon, lat] = feature.geometry?.coordinates || [0, 0];

        let status: 'OPEN' | 'CLOSED' | 'PARTIAL' | 'ALERT' = 'ALERT';
        const codeStr = properties.code?.toLowerCase() || '';
        const iconUrl = properties.url_icone?.toLowerCase() || '';

        for (const [key, value] of Object.entries(INFOROUTE06_STATUS_MAP)) {
          if (codeStr.includes(key) || iconUrl.includes(key)) {
            status = value;
            break;
          }
        }

        return {
          id: `inforoute09-${properties.titre?.replace(/\s+/g, '-').toLowerCase()}`,
          name: properties.titre || 'Unknown Pass',
          altitude: ((): number => {
            if (properties.altitude) {
              const n = Number(String(properties.altitude).replace(/[^\d.-]/g, ''));
              if (!Number.isNaN(n)) return n;
            }

            const title = properties.titre || '';
            const match = title.match(/-\s*([\d\s,.]+)m/i) || title.match(/([\d\s,.]+)m/i);
            if (match && match[1]) {
              const cleaned = match[1].replace(/[^\d]/g, '');
              const parsed = parseInt(cleaned, 10);
              if (!Number.isNaN(parsed)) return parsed;
            }

            return 0;
          })(),
          region: `Ariège`,
          department: '09',
          status: status,
          updated: new Date(),
          source: 'inforoute09.fr',
          country: 'France',
          massif: 'Pyrénées',
          coordinates: [lat, lon] as [number, number]
        };
      });
  } catch (error) {
    console.error('Failed to fetch Inforoute09 passes:', error);
    return [];
  }
}

export async function fetchInforoute31Passes(): Promise<MountainPass[]> {
  try {
    const formData = new URLSearchParams();
    formData.append('action', '374');
    formData.append('protect', '1');

    const response = await fetch('https://www.inforoute31.fr/mod_turbolead/mod/inforoute/index.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString()
    });

    if (!response.ok) {
      console.error('Inforoute31 API error:', response.status);
      return [];
    }

    const data = await response.json();

    if (!data.features || !Array.isArray(data.features)) {
      console.error('Unexpected Inforoute31 API response format');
      return [];
    }

    return data.features
      .filter((feature: any) => {
        const properties = feature.properties || {};
        const titre = (properties.titre || '').toLowerCase();
        const code = (properties.code || '').toUpperCase();
        return titre.includes('col ') && code.startsWith('C');
      })
      .map((feature: any) => {
        const properties = feature.properties || {};
        const [lon, lat] = feature.geometry?.coordinates || [0, 0];

        let status: 'OPEN' | 'CLOSED' | 'PARTIAL' | 'ALERT' = 'ALERT';
        const codeStr = properties.code?.toLowerCase() || '';
        const iconUrl = properties.url_icone?.toLowerCase() || '';

        for (const [key, value] of Object.entries(INFOROUTE06_STATUS_MAP)) {
          if (codeStr.includes(key) || iconUrl.includes(key)) {
            status = value;
            break;
          }
        }

        return {
          id: `inforoute31-${properties.titre?.replace(/\s+/g, '-').toLowerCase()}`,
          name: properties.titre || 'Unknown Pass',
          altitude: ((): number => {
            if (properties.altitude) {
              const n = Number(String(properties.altitude).replace(/[^\d.-]/g, ''));
              if (!Number.isNaN(n)) return n;
            }

            const title = properties.titre || '';
            const match = title.match(/-\s*([\d\s,.]+)m/i) || title.match(/([\d\s,.]+)m/i);
            if (match && match[1]) {
              const cleaned = match[1].replace(/[^\d]/g, '');
              const parsed = parseInt(cleaned, 10);
              if (!Number.isNaN(parsed)) return parsed;
            }

            return 0;
          })(),
          region: `Haute-Garonne`,
          department: '31',
          status: status,
          updated: new Date(),
          source: 'inforoute31.fr',
          country: 'France',
          massif: 'Pyrénées',
          coordinates: [lat, lon] as [number, number]
        };
      });
  } catch (error) {
    console.error('Failed to fetch Inforoute31 passes:', error);
    return [];
  }
}

export async function fetchInforouteHaPyPasses(): Promise<MountainPass[]> {
  try {
    const url = 'https://inforoute.ha-py.fr/myd/proxy.php?cluster=&tifid=&type=30.02&cc=12345';
    const response = await fetch(url);
    if (!response.ok) {
      console.error('Inforoute Ha-Py API error:', response.status);
      return [];
    }
    const data = await response.json();

    // Normalise: l'API peut renvoyer un tableau ou un objet { OI: [...] }
    let items: any[] = [];
    if (Array.isArray(data)) items = data;
    else if (data && Array.isArray((data as any).OI)) items = (data as any).OI;
    else {
      for (const k of Object.keys(data || {})) {
        if (Array.isArray((data as any)[k])) {
          items = (data as any)[k];
          break;
        }
      }
    }

    return items
      .filter((it: any) => {
        const title = String(it.titre || it.lib || it.libelle || '');
        return title.toLowerCase().includes('col');
      })
      .map((it: any) => {
        const titleRaw = String(it.titre || it.lib || it.libelle || '');
        // Nettoyages basiques (FERMETURE / codes de route en tête)
        let candidate = titleRaw.replace(/\bFERMETURE\b/gi, '').replace(/\bFERM[ÉE]\b/gi, '').replace(/\bFERME\b/gi, '').trim();
        candidate = candidate.replace(/^[A-Z]+\d+\s+/i, '').trim();
        const colMatch = candidate.match(/col[^,;:-]*/i);
        const name = (colMatch ? colMatch[0].trim().replace(/\s+/g, ' ') : candidate || titleRaw);

        // Altitude: champ direct > extraction depuis le titre > lookup dans PASS_ALTITUDES
        let altitude = 0;
        if (it.altitude) {
          const n = Number(String(it.altitude).replace(/[^\d.-]/g, ''));
          if (!Number.isNaN(n)) altitude = n;
        }
        if (!altitude) {
          const m = titleRaw.match(/-\s*([\d\s,.]+)m/i) || titleRaw.match(/([\d\s,.]+)m/i);
          if (m && m[1]) {
            const parsed = parseInt(m[1].replace(/[^\d]/g, ''), 10);
            if (!Number.isNaN(parsed)) altitude = parsed;
          }
        }
        if (!altitude) {
          for (const [k, v] of Object.entries(PASS_ALTITUDES)) {
            if (name.toLowerCase().includes(k.toLowerCase())) { altitude = v; break; }
          }
        }

        // Statut heuristique depuis titre / soustitre / catégorie
        let status: 'OPEN' | 'CLOSED' | 'PARTIAL' | 'ALERT' = 'ALERT';
        const lower = (titleRaw + ' ' + String(it.soustitre || it.sous_titre || '')).toLowerCase();
        if (lower.includes('ferme') || lower.includes('fermeture') || lower.includes('fermet')) status = 'CLOSED';
        else if (lower.includes('ouvert') || lower.includes('ouverture')) status = 'OPEN';
        else if (lower.includes('partiel') || lower.includes('alternat') || lower.includes('sens unique') || lower.includes('une voie')) status = 'PARTIAL';

        const lat = it.lat ? Number(String(it.lat).replace(',', '.')) : 0;
        const lon = it.lng ? Number(String(it.lng).replace(',', '.')) : 0;
        const updated = it.date_debut ? new Date(it.date_debut) : new Date();

        return {
          id: `inforoute-hapy-${String(it.id || it.pid || name).replace(/\s+/g, '-').toLowerCase()}`,
          name,
          altitude,
          region: `Hautes-Pyrénées`,
          department: '65',
          status,
          updated,
          source: 'inforoute.ha-py.fr',
          country: 'France',
          massif: 'Pyrénées',
          coordinates: [lat || 0, lon || 0] as [number, number]
        } as MountainPass;
      });
  } catch (error) {
    console.error('Failed to fetch Inforoute Ha-Py passes:', error);
    return [];
  }
}

// Fetch passes from the South Tyrol / Provincia Bolzano traffic feed
export async function fetchProvinceBZPasses(): Promise<MountainPass[]> {
  try {
    const ts = Math.floor(Date.now() / 1000);
    const url = `https://static-verkehr.provinz.bz.it/publications/traffic/traffic.json?_=${ts}`;

    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
      }
    });

    if (!response.ok) {
      console.error('Province BZ traffic API error:', response.status);
      return [];
    }

    const items = await response.json() as Array<{
      tycodeValue?: string;
      publishDateTime?: string;
      subTycodeValue?: string;
      subTycodeDe?: string;
      subTycodeIt?: string;
      placeDe?: string;
      placeIt?: string;
      messageId?: string;
      messageStreetInternetDescDe?: string;
      messageStreetInternetDescIt?: string;
      messageStreetWapDescDe?: string;
      messageStreetWapDescIt?: string;
      messageZoneDescDe?: string;
      messageZoneDescIt?: string;
      messageGradDescDe?: string;
      messageGradDescIt?: string;
      X?: number;
      Y?: number;
    }>;

    if (!Array.isArray(items)) {
      console.error('Unexpected Province BZ API response format');
      return [];
    }

    return items
      .filter((it) => String(it.tycodeValue ?? '').trim() === 'PÄSSE')
      .map((it) => {
        const name =
          it.messageStreetWapDescIt ||
          'Unknown Pass';

        const statusText = `${it.subTycodeValue ?? ''} ${it.messageGradDescDe ?? ''} ${it.messageGradDescIt ?? ''}`.toLowerCase();
        const messageGradIt = String(it.messageGradDescIt ?? '').toLowerCase();
        let status: 'OPEN' | 'CLOSED' | 'PARTIAL' | 'ALERT' = 'ALERT';
        // Treat specific Italian phrases as CLOSED
        if (messageGradIt.includes('traffico bloccato')) status = 'CLOSED';
        else if (messageGradIt.includes('percorribile liberamente')) status = 'OPEN';
        else if (messageGradIt.includes('rallentamenti')) status = 'ALERT';
        else status = 'PARTIAL';

        const conditions = it.placeDe ? [it.placeDe] : [];

        return {
          id: `bz-${String(it.messageId ?? name).replace(/\s+/g, '-').toLowerCase()}`,
          name,
          altitude: PASS_ALTITUDES[name] || 0,
          region: it.messageZoneDescDe || it.messageZoneDescIt || 'Südtirol / Alto Adige',
          department: 'BZ',
          status,
          updated: it.publishDateTime ? new Date(it.publishDateTime) : new Date(),
          source: 'traffic.province.bz.it',
          country: 'Italie',
          massif: 'Dolomites',
          coordinates: [Number(it.Y ?? 0), Number(it.X ?? 0)] as [number, number],
          conditions: conditions.length ? conditions : undefined
        } as MountainPass;
      });
  } catch (error) {
    console.error('Failed to fetch Province BZ traffic passes:', error);
    return [];
  }
}

export async function getAllMountainPasses(): Promise<MountainPass[]> {
  try {
    const passes = await Promise.all([
      fetchSavoieRoutePasses(), // 73
      fetchInforoute74Passes(), // 74
      fetchInforoute04Passes(), // 04
      fetchInforouteLE64Passes(), // 64
      fetchInforoute66Passes(), // 66
      fetchInforouteHaPyPasses(), // 65
      fetchInforoute09Passes(), // 09
    //   fetchInforoute31Passes(), // 31
      fetchInforoute06Passes(), // 06
      fetchHautesAlpesPasses(), // 05
      fetchProvinceBZPasses(), // BZ
    ]);

    const merged = passes.flat();

    // Sort by country, then massif, then name
    merged.sort((a, b) => {
      const ca = a.country || '';
      const cb = b.country || '';
      if (ca !== cb) return ca.localeCompare(cb);

      const ma = a.massif || '';
      const mb = b.massif || '';
      if (ma !== mb) return ma.localeCompare(mb);

      return (a.name || '').localeCompare(b.name || '');
    });

    return merged;
  } catch (error) {
    console.error('Failed to fetch mountain passes:', error);
    return [];
  }
}

/**
 * Filter passes by department code (two-digit string, e.g. '73')
 */
export function filterByDepartment(passes: MountainPass[], department: string): MountainPass[] {
  if (!department || department === 'ALL') return passes;
  const code = String(department).padStart(2, '0');
  return passes.filter(pass => String(pass.department || '').padStart(2, '0') === code);
}
