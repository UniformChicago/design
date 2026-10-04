// Drop-in for server-rendered pages: <canvas id="atmosphere" aria-hidden="true"></canvas>
// <script type="module" src="/design/atmosphere.js"></script>
import { mountAtmosphere } from "./waves.js";
mountAtmosphere(document.querySelector("#atmosphere"));
