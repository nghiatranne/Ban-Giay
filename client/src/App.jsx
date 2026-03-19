import './App.css';
import Banner from './components/Banner';
import BlogHome from './components/BlogHome';
import Category from './components/Category';
import Counpon from './components/Counpon';
import FeedbackHome from './components/FeedbackHome';
import FlashSale from './components/FlashSale';
import Footer from './components/Footer';
import Header from './components/Header';

function App() {
    return (
        <div>
            <header>
                <Header />
            </header>

            <main>
                <Banner />
                <Counpon />
                <FlashSale />
                <Category />
                <FeedbackHome />
                {/* <BlogHome /> */}
            </main>

            <footer>
                <Footer />
            </footer>
        </div>
    );
}

export default App;
