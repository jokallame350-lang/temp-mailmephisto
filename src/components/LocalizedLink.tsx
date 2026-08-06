import React from 'react';
import { Link as RouterLink, LinkProps } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export const Link: React.FC<LinkProps> = ({ to, ...props }) => {
  const { lang } = useLanguage();
  
  let localizedTo = to;
  if (lang !== 'en' && typeof to === 'string') {
    if (to === '/') {
      localizedTo = `/${lang}`;
    } else if (to.startsWith('/') && !to.startsWith(`/${lang}/`) && to !== `/${lang}`) {
      localizedTo = `/${lang}${to}`;
    }
  }
  
  return <RouterLink to={localizedTo} {...props} />;
};
