const Footer = ({ menu, logo, copyright }) => {
  return (
    <footer className="bg-white">
      <div className="mx-auto flex max-w-screen-xl flex-col items-center gap-6 border-t border-gray-100 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex w-full min-h-8 justify-center">{menu}</div>
        <div className="flex min-h-8 max-h-12 items-center justify-center">{logo}</div>
        <div className="min-h-4 text-center text-xs text-gray-600">{copyright}</div>
      </div>
    </footer>
  );
};

export default Footer;
