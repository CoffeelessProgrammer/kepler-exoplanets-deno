import { join } from "https://deno.land/std/path/mod.ts";
import { BufReader } from "https://deno.land/std/io/bufio.ts";
import { parse } from "https://deno.land/std/encoding/csv.ts";
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
    const newEarthLike = allExoplanets.filter((exoplanet) => {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibW9kLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxJQUFJLEVBQUUsTUFBTSxtQ0FBbUMsQ0FBQztBQUN6RCxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sbUNBQW1DLENBQUM7QUFDOUQsT0FBTyxFQUFFLEtBQUssRUFBRSxNQUFNLHVDQUF1QyxDQUFDO0FBTTlELEtBQUssVUFBVSxxQkFBcUI7SUFDaEMsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLFFBQVEsRUFBRSw0QkFBNEIsQ0FBQyxDQUFDO0lBRTlELE1BQU0sZUFBZSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDaEQsTUFBTSxTQUFTLEdBQUcsSUFBSSxTQUFTLENBQUMsZUFBZSxDQUFDLENBQUM7SUFDakQsTUFBTSxlQUFlLEdBQUcsTUFBTSxLQUFLLENBQUMsU0FBUyxFQUFFO1FBQzNDLE1BQU0sRUFBRSxJQUFJO1FBQ1osT0FBTyxFQUFFLEdBQUc7S0FDZixDQUFDLENBQUM7SUFFSCxJQUFJLENBQUMsS0FBSyxDQUFDLGVBQWUsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUVoQyxPQUFPLGVBQWUsQ0FBQztBQUMzQixDQUFDO0FBRUQsS0FBSyxVQUFVLHVCQUF1QjtJQUNsQyxNQUFNLGFBQWEsR0FBRyxNQUFNLHFCQUFxQixFQUFFLENBQUM7SUFHcEQsTUFBTSxZQUFZLEdBQUksYUFBK0IsQ0FBQyxNQUFNLENBQUMsQ0FBQyxTQUFTLEVBQUUsRUFBRTtRQUN2RSxNQUFNLGVBQWUsR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7UUFDdEQsTUFBTSxXQUFXLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO1FBQ25ELE1BQU0sYUFBYSxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztRQUVwRCxPQUFPLFNBQVMsQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLFdBQVc7ZUFDNUMsZUFBZSxHQUFHLEdBQUcsSUFBSSxlQUFlLEdBQUcsR0FBRztlQUM5QyxXQUFXLEdBQUcsSUFBSSxJQUFJLFdBQVcsR0FBRyxJQUFJO2VBQ3hDLGFBQWEsR0FBRyxJQUFJLElBQUksYUFBYSxHQUFHLElBQUksQ0FBQztJQUN4RCxDQUFDLENBQUMsQ0FBQztJQUVILE9BQU8sWUFBWSxDQUFDO0FBQ3hCLENBQUM7QUFFRCxNQUFNLG1CQUFtQixHQUFHLE1BQU0sdUJBQXVCLEVBQUUsQ0FBQztBQUU1RCxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsbUJBQW1CLENBQUMsTUFBTSwyQkFBMkIsQ0FBQyxDQUFDIn0=