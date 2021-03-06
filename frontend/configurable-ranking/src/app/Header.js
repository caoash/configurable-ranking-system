import "../resources/App.css"

const Header = (props) => {
    return (
        <>{props.includeFake && <nav className="bg-dark">
            <div className="header">
                <p className="large-text-format">Customizable Ranking System</p>
            </div>
        </nav>
        }
        <nav className="bg-dark fixed-top">
            <div className="header">
                <p className="large-text-format">Customizable Ranking System</p>
                <a className="header-text-format" href="/browse">Home</a>
                <a className="header-text-format" href="/import">Import</a>
                <a className="header-text-format" href="/about">About</a>
            </div>
        </nav></>
    )
}

export default Header;