import shuffle from "lodash-es/shuffle";

import MONET from "./assets/img/paintings/Monet_Nympheas_1904.png";
import MUNCH from "./assets/img/paintings/Munch_-_The_Scream.png";
import LEVINE from "./assets/img/paintings/Levine_-_The_Lightness_of_Being.png";

const paintings = [MONET, MUNCH, LEVINE];

export default shuffle(paintings);
