import "./Search.css"

const SearchBar = () => (
    <form action="/home" method="get">
        <label htmlFor="header-search">
            <span className="visually-hidden">Search blog posts</span>
        </label>
        <input
            type="text"
            id="header-search"
            placeholder="Search Colleges"
            name="s" 
        />
        <button type="submit">Search</button>
    </form>
);

export default SearchBar;