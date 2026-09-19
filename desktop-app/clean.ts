// Removes the ../dist build output dir. Run: deno task clean
import { join } from "std/path";

const dist = join(new URL(".", import.meta.url).pathname.replace(/^\//, ""), "..", "dist");
try {
  await Deno.remove(dist, { recursive: true });
  console.log("Removed", dist);
} catch (e) {
  if (e instanceof Deno.errors.NotFound) {
    console.log("Nothing to clean:", dist);
  } else {
    throw e;
  }
}
