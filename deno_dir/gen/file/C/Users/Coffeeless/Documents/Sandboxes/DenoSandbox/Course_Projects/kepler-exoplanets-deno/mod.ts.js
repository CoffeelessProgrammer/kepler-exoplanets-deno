import { join, BufReader, parse } from "./deps.ts";
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibW9kLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBRSxNQUFNLFdBQVcsQ0FBQztBQU1uRCxLQUFLLFVBQVUscUJBQXFCO0lBQ2hDLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLEVBQUUsNEJBQTRCLENBQUMsQ0FBQztJQUU5RCxNQUFNLGVBQWUsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ2hELE1BQU0sU0FBUyxHQUFHLElBQUksU0FBUyxDQUFDLGVBQWUsQ0FBQyxDQUFDO0lBRWpELE1BQU0sZUFBZSxHQUFHLE1BQU0sS0FBSyxDQUFDLFNBQVMsRUFBRTtRQUMzQyxNQUFNLEVBQUUsSUFBSTtRQUNaLE9BQU8sRUFBRSxHQUFHO0tBQ2YsQ0FBQyxDQUFDO0lBRUgsSUFBSSxDQUFDLEtBQUssQ0FBQyxlQUFlLENBQUMsR0FBRyxDQUFDLENBQUM7SUFFaEMsT0FBTyxlQUFlLENBQUM7QUFDM0IsQ0FBQztBQUVELEtBQUssVUFBVSx1QkFBdUI7SUFDbEMsTUFBTSxhQUFhLEdBQUcsTUFBTSxxQkFBcUIsRUFBRSxDQUFDO0lBRXBELE1BQU0sWUFBWSxHQUFJLGFBQStCLENBQUMsTUFBTSxDQUFDLENBQUMsU0FBUyxFQUFFLEVBQUU7UUFDdkUsTUFBTSxlQUFlLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO1FBQ3RELE1BQU0sV0FBVyxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztRQUNuRCxNQUFNLGFBQWEsR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7UUFFcEQsT0FBTyxTQUFTLENBQUMsaUJBQWlCLENBQUMsS0FBSyxXQUFXO2VBQzVDLGVBQWUsR0FBRyxHQUFHLElBQUksZUFBZSxHQUFHLEdBQUc7ZUFDOUMsV0FBVyxHQUFHLElBQUksSUFBSSxXQUFXLEdBQUcsSUFBSTtlQUN4QyxhQUFhLEdBQUcsSUFBSSxJQUFJLGFBQWEsR0FBRyxJQUFJLENBQUM7SUFDeEQsQ0FBQyxDQUFDLENBQUM7SUFFSCxPQUFPLFlBQVksQ0FBQztBQUN4QixDQUFDO0FBRUQsTUFBTSxtQkFBbUIsR0FBRyxNQUFNLHVCQUF1QixFQUFFLENBQUM7QUFNNUQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLG1CQUFtQixDQUFDLE1BQU0sMkJBQTJCLENBQUMsQ0FBQyJ9