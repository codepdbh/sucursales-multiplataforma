import { Link } from "react-router-dom"

export const DefaultLayout = () => {
  return (
    <header>
        <nav>
            <ul>
                
                <li><Link to="/"/>Login</li>
            </ul>
        </nav>
    </header>
  )
}
