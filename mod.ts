import { join, BufReader, parse, _ } from "./deps.ts";

interface Planet {
    [ key : string ]: string
}

async function loadAllExoplanetsData(): Promise<Array<Planet>> {
    const filepath = join("assets", "kepler_exoplanets_nasa.csv");

    const exoplanets_file = Deno.openSync(filepath);
    const bufReader = new BufReader(exoplanets_file);

    const exoplanets_data: Planet[] = await parse(bufReader, {
        header: true,
        comment: "#"
    }) as Array<Planet>;

    Deno.close(exoplanets_file.rid);

    return exoplanets_data;
}

async function findEarthLikeQualities(): Promise<Array<Planet>> {
    const allExoplanets = await loadAllExoplanetsData();

    const newEarthLike: Planet[] = (allExoplanets as Array<Planet>).filter((exoplanet) => {
        const planetaryRadius = Number(exoplanet["koi_prad"]);
        const stellarMass = Number(exoplanet["koi_smass"]);
        const stellarRadius = Number(exoplanet["koi_srad"]);

        return exoplanet["koi_disposition"] === "CONFIRMED"
            && planetaryRadius > 0.5 && planetaryRadius < 1.5
            && stellarMass > 0.78 && stellarMass < 1.04
            && stellarRadius > 0.99 && stellarRadius < 1.01;
    });

    return newEarthLike;
}

function showRelevantProperties(exoplanets: Array<Planet>): Array<Planet> {
    return exoplanets.map((exoplanet) => {
        return _.pick(exoplanet, [
            "kepid",
            "kepoi_name",
            "kepler_name",
            "koi_prad",
            "koi_smass",
            "koi_srad",
            "koi_count",
            "koi_sage",
            "koi_steff",
            "koi_period"
        ])
    });
}

function filterForNumericProperty(exoplanets: Array<Planet>, property: string): Array<number> {
    const filtered = exoplanets.map((exoplanet) => {
        return Number(exoplanet[property]);
    });

    return filtered;
}

//---------------------------------------------------------------------
// ----------                 MAIN PROGRAM                   ----------
//---------------------------------------------------------------------

const newEarthLikePlanets = showRelevantProperties(await findEarthLikeQualities());

for (const exoplanet of newEarthLikePlanets) {
    console.log(exoplanet);
}

console.log(`\n${newEarthLikePlanets.length} habitable planets found!`);

// Earth-like Exoplanet Orbital Periods
const orbitalPeriods = filterForNumericProperty(newEarthLikePlanets, "koi_period");
const minPeriod = Math.min(...orbitalPeriods);
const maxPeriod = Math.max(...orbitalPeriods);
console.log(`Shortest Orbital: ${minPeriod} days`);
console.log(`Longest Orbital: ${maxPeriod} days`);