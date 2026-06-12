export const BrowserRouter = ({children}) => children;
export const Routes = ({children}) => children;
export const Route = ({element}) => element;
export const Navigate = () => null;
export const Link = ({children, to}) => <a href={to}>{children}</a>;
export const useNavigate = () => () => {};
export const useLocation = () => ({ pathname: '/' });
export const useParams = () => ({});
