import { useState, useEffect } from "react"
import Search from "./compunds/Search"
import { Loading } from "./compunds/loading"
import MovieCard from "./compunds/movieCard"
import { useDebounce } from "react-use"
import updateSearchCount, { getTrendingMovies } from "./appwrite"

const API_BASE_URL = "https://api.themoviedb.org/3"
const API_KEY = import.meta.env.VITE_TMBD_API_KEY
const API_OPTIONS = {
  method: "GET",
  headers: {
    accept: "application/json",
    Authorization: `Bearer ${API_KEY}`,
  },
}

function App() {
  const [searchTerm, setSearchTerm] = useState("")
  const [errorMessage, setErrorMessage] = useState("")

  const [movieList, setMovieList] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")

  useDebounce(() => setDebouncedSearchTerm(searchTerm), 500, [searchTerm])

  const fetchMovies = async (query = "") => {
    setIsLoading(true)
    setErrorMessage("")

    try {
      const endpoint = query
        ? `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}`
        : `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`
      const response = await fetch(endpoint, API_OPTIONS)
      if (!response.ok) {
        throw new Error("failed to fetch movies")
      }
      const data = await response.json()
      if (data.Response === "false") {
        setErrorMessage(data.Error || "falid to fetch movies")
        setMovieList([])
        return
      }
      setMovieList(data.results)
      if (query && data.results.length > 0) {
        await updateSearchCount(query, data.results[0])
      }
    } catch (err) {
      console.error(`Error fetching movies: ${err}`)
      setErrorMessage("Error fetching movies. please try again later")
    } finally {
      setIsLoading(false)
    }
  }

  async function loadTrendingMovies() {
    try {
      const movies = await getTrendingMovies()
      setTrendingMovies(movies)
    } catch (error) {
      console.error(`Error fetching trending movies ${error}`)
    }
  }
  useEffect(() => {
    fetchMovies(debouncedSearchTerm)
  }, [debouncedSearchTerm])

  useEffect(() => {
    loadTrendingMovies()
  }, [])
  return (
    <main>
      <div className="pattern" />

      <div className="wrapper">
        <header>
          <img src="./hero.png" alt="hero Banner" />
          <h1>
            Find <span className="text-gradient">Movies</span> You'll Enjoy
            Without the Hassle
          </h1>
          <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        </header>

        <section className="all-movies">
          <h2>All Movies</h2>
          {isLoading ? (
            <Loading />
          ) : errorMessage ? (
            <p className="text-red-500">{errorMessage}</p>
          ) : (
            <ul>
              {movieList.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </ul>
          )}

          {errorMessage && <p className="text-red-500">{errorMessage}</p>}
        </section>
      </div>
    </main>
  )
}

export default App
