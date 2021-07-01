import './App.css';
import Header from "./Header.js"
import Controls from "./Controls.js"
import Table from "./Table.js"
import {BrowserRouter, Route, Redirect} from 'react-router-dom'

const App = () => {
  return (
    <BrowserRouter>
      <Route exact path = "/">
        <Redirect to="/home"/>
      </Route>
      <Route path = "/home">
        <div className = "main-container">
          <Header />
          <div className = "main-body">
            <Controls />
            <Table />
          </div>
        </div>
      </Route>
      <Route path = "/about">
        <div className = "main-container">
          <Header />
        </div>
      </Route>
    </BrowserRouter>
    
  )
}

export default App;
