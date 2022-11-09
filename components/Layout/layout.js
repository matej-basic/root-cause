import FLNavbar from "../Navbar/navbar";

function Layout(props) {
  return (
    <>
      <FLNavbar />
      {props.children}
    </>
  );
}

export default Layout;
