import { Route, Routes } from "react-router-dom";
import CharacterSelect from "@/pages/CharacterSelect";
import CreateRoom from "@/pages/CreateRoom";
import Diag from "@/pages/Diag";
import Game from "@/pages/Game";
import Home from "@/pages/Home";
import Join from "@/pages/Join";
import Lobby from "@/pages/Lobby";
import Results from "@/pages/Results";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/create" element={<CreateRoom />} />
      <Route path="/join" element={<Join />} />
      <Route path="/room/:code/character" element={<CharacterSelect />} />
      <Route path="/room/:code/lobby" element={<Lobby />} />
      <Route path="/room/:code/game" element={<Game />} />
      <Route path="/room/:code/results" element={<Results />} />
      <Route path="/diag" element={<Diag />} />
    </Routes>
  );
}
