export const getBaseUrl = () => import.meta.env.BASE_URL;

export const loadManifest = async () => {
    const res = await fetch(`${getBaseUrl()}data/manifest.json`);
    if (!res.ok) throw new Error('Failed to load manifest.json');
    return await res.json();
};

export const loadData = async (filename) => {
    // Force 'sample' mode for GitHub Pages deployment
    const mode = 'sample';

    // All files are located in data/sample/
    const path = `${mode}/${filename}`;

    const url = `${getBaseUrl()}data/${path}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to load ${url}`);
    return await res.json();
};
