import {Navbar, Footer, Loader, Transaction, Services, Welcome} from './components';

export default function App() {
    return (
        <div className="min-h-screen">
            <div className="gradient-bg-welcome">
                <Navbar />
                <Welcome />
            </div>
            <Services />
            <Transaction />
            <Footer />
        </div>
    )
}
