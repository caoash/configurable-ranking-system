import './App.css';
import Header from "./Header.js"
import {BrowserRouter, Route, Redirect} from 'react-router-dom'
import Body from "./Body.js"

const App = () => {
  return (
    <BrowserRouter>
      <Route exact path = "/">
        <Redirect to="/home"/>
      </Route>
      <Route path = "/home">
        <div className = "main-container">
          <Header />
          <Body />
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
