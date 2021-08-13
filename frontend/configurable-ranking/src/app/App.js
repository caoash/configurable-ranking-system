import '../resources/App.css';
import Header from "./Header.js"
import {BrowserRouter, Route, Redirect} from 'react-router-dom'
import ViewTable from "./ViewTable.js"
import BrowseTables from "./BrowseTables.js"
import ImportDb from "./ImportDb.js"

const App = () => {
  return (
    <BrowserRouter>
      <Route exact path = "/">
        <Redirect to="/browse"/>
      </Route>
      <Route path = "/view/:tableName">
        <div className = "main-container">
          <Header includeFake/>
          <ViewTable />
        </div>
      </Route>
      <Route path = "/browse">
        <div className = "main-container">
          <Header includeFake/>
          <BrowseTables />
        </div>
      </Route>
      <Route path = "/about">
        <div className = "main-container">
          <Header />
        </div>
      </Route>
      <Route path="/import">
        <div className="main-container">
            <Header includeFake/>
            <ImportDb/>
        </div>
      </Route>
    </BrowserRouter>
    
  )
}

export default App;
