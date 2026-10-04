import { useEffect, useState } from "react";
import { IoSearch } from "react-icons/io5";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { TypeAnimation } from "react-type-animation";
import { FaArrowLeft } from "react-icons/fa";
import useMobile from "../hooks/useMobile";
import useDebounce from "../hooks/useDebounce";

const Search = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile] = useMobile();

  const isSearchPage = location.pathname === "/search";
  const urlText = new URLSearchParams(location.search).get("q") || "";

  // What the user is typing (updates instantly, no lag in the input)
  const [inputValue, setInputValue] = useState(urlText);
  // Same value, but only after the user stops typing for 500ms
  const debouncedValue = useDebounce(inputValue, 500);

  // leaving the search page -> clear the box, so coming back starts fresh
  useEffect(() => {
    if (!isSearchPage) {
      setInputValue("");
    }
  }, [isSearchPage]);

  // Update the URL (which triggers the product search) only with the debounced value
  useEffect(() => {
    if (!isSearchPage) return;

    const text = debouncedValue.trim();
    if (text === urlText.trim()) return; // nothing changed, avoid extra navigation

    const url = text ? `/search?q=${encodeURIComponent(text)}` : "/search";
    // replace: true -> typing doesn't fill browser history with one entry per search
    navigate(url, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedValue, isSearchPage]);

  const redirectToSearchPage = () => {
    navigate("/search");
  };

  return (
    <div className="w-full min-w-[300px] lg:min-w-[420px] h-11 lg:h-12 rounded-lg border overflow-hidden flex items-center text-neutral-500 bg-slate-50 group focus-within:border-primary-200">
      <div>
        {isMobile && isSearchPage ? (
          <Link
            to={"/"}
            className="flex justify-center items-center h-full p-2 m-1 group-focus-within:text-primary-200 bg-white rounded-full shadow-md"
          >
            <FaArrowLeft size={20} />
          </Link>
        ) : (
          <button className="flex justify-center items-center h-full p-3 group-focus-within:text-primary-200">
            <IoSearch size={22} />
          </button>
        )}
      </div>

      <div className="w-full h-full">
        {!isSearchPage ? (
          // not on search page
          <div
            onClick={redirectToSearchPage}
            className="w-full h-full flex items-center"
          >
            <TypeAnimation
              sequence={[
                'Search "milk"',
                1000,
                'Search "bread"',
                1000,
                'Search "sugar"',
                1000,
                'Search "paneer"',
                1000,
                'Search "chocolate"',
                1000,
                'Search "curd"',
                1000,
                'Search "rice"',
                1000,
                'Search "egg"',
                1000,
                'Search "chips"',
              ]}
              wrapper="span"
              speed={50}
              repeat={Infinity}
            />
          </div>
        ) : (
          // on search page
          <div className="w-full h-full">
            <input
              type="text"
              placeholder="Search for atta dal and more."
              autoFocus
              value={inputValue}
              className="bg-transparent w-full h-full outline-none"
              onChange={(e) => setInputValue(e.target.value)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
