import { join } from "https://deno.land/std/path/mod.ts";
import { BufReader } from "https://deno.land/std/io/bufio.ts";
import { parse } from "https://deno.land/std/encoding/csv.ts";

interface Planet {
    [ key : string ]: string
}

async function loadAllExoplanetsData() {
    const filepath = join("assets", "kepler_exoplanets_nasa.csv");

    const exoplanets_file = Deno.openSync(filepath);
    const bufReader = new BufReader(exoplanets_file);

    const exoplanets_data = await parse(bufReader, {
        header: true,
        comment: "#"
    });

    Deno.close(exoplanets_file.rid);

    return exoplanets_data;
}

async function filterForEarthLikeProps() {
    const allExoplanets = await loadAllExoplanetsData();

    const newEarthLike = (allExoplanets as Array<Planet>).filter((exoplanet) => {
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

const newEarthLikePlanets = await filterForEarthLikeProps();

console.log(`${newEarthLikePlanets.length} habitable planets found!`);