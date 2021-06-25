import './App.css';
import Header from "./Header.js"
import Controls from "./Controls.js"
import Table from "./Table.js"


const App = () => {
  let objs = [];
  let head = [];
  head.push(["College", "Location", "Size", "Acceptance Rate", "Graduation Rate", "Average ACT Score", "Ranking"]);
  objs.push(["Random College", "Random Place", "Large", "10%", "90%", "35", "3rd"]);
  objs.push(["Random College 2", "Random Place 2", "Small", "99%", "10%", "24", "136th"]);
  objs.push(["Random College 3", "Random Place 3", "N/A", "N/A", "N/A", "N/A", "N/A"]);
  objs.push(["Random College 4", "Random Place 4", "N/A", "N/A", "N/A", "N/A", "N/A"]);
  objs.push(["Random College 5", "Random Place 5", "N/A", "N/A", "N/A", "N/A", "N/A"]);
  objs.push(["Random College 6", "Random Place 6", "N/A", "N/A", "N/A", "N/A", "N/A"]);
  return (
    <div class = "main-container">
      <Header />
      <div class = "main-body">
        {/* <Controls /> */}
        <Table hinfo = {head} info = {objs}/>
      </div>
    </div>
  )
}

export default App;
