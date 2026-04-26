Postgresql 18.3 Windows x86-64 (pgadmin4 or psql)

1-Récupérer le projet
 git clone https://github.com/churnguard-team/booktrack-churnguard.git
 cd booktrack-churnguard

 Si le repo est déjà cloné: git pull

 2-Créer leur fichier .env local à côté de docker-compose.yml avec au minimum:
  POSTGRES_PASSWORD=un_mot_de_passe_local
3-supprimer le volume et Démarrer la base
 docker compose down -v   # ← supprime le volume ancien (IMPORTANT)
 docker compose up -d

4-Vérifier que le service tourne :
 docker compose ps
 docker compose logs postgres --tail=50

5-Vérifier que l’import SQL a marché :
 docker compose exec postgres psql -U postgres -d bookdatabase -c "\dt"
 docker compose exec postgres psql -U postgres -d bookdatabase -c "\d users"

 Si ça bloque chez quelqu’un (ancien conteneur/volume), faire un reset local:
 docker compose down -v --remove-orphans
 docker compose up -d
 
relancer docker : docker compose up -d --build

note: pour lancer l'app :  docker compose up va lancer les serveurs back et front
  API racine : http://localhost:8000/
  API livres : http://localhost:8000/books
  Front : http://localhost:3000/books

  si requirement.txt a changer : docker compose up -d --build backend


npm install next-auth@4





























-- Insère un administrateur dans la base de données
-- Le mot de passe "admin1234" est accepté en clair grâce au fallback du backend
INSERT INTO public.admins (email, password_hash, nom, prenom, role, is_active)
VALUES (
    'admin@booktrack.com',
    'admin1234',
    'Dupont',
    'Jean',
    'SUPER_ADMIN',
    true
);












-- Insertion de 50 livres avec couvertures Open Library
INSERT INTO public.books (title, auteur, genre, description, isbn, cover_url, nb_pages, date_publication, langue)
VALUES

-- 1. Fantastique
('Harry Potter à l''école des sorciers', 'J.K. Rowling', 'Fantastique',
 'Un jeune orphelin découvre qu''il est un sorcier et intègre l''école de Poudlard.',
 '9782070584628', 'https://covers.openlibrary.org/b/isbn/9782070584628-L.jpg', 308, '1998-10-09', 'fr'),

-- 2. Fantastique
('Harry Potter et la Chambre des secrets', 'J.K. Rowling', 'Fantastique',
 'Harry retourne à Poudlard et découvre un mystérieux danger.',
 '9782070584598', 'https://covers.openlibrary.org/b/isbn/9782070584598-L.jpg', 352, '1999-04-02', 'fr'),

-- 3. Fantastique
('Le Seigneur des anneaux : La Communauté de l''anneau', 'J.R.R. Tolkien', 'Fantastique',
 'Frodon hérite d''un anneau magique et doit partir en quête pour le détruire.',
 '9782267011258', 'https://covers.openlibrary.org/b/isbn/9782267011258-L.jpg', 528, '1954-07-29', 'fr'),

-- 4. Classique
('Le Petit Prince', 'Antoine de Saint-Exupéry', 'Classique',
 'Un aviateur rencontre un petit prince venu d''une autre planète.',
 '9782070408504', 'https://covers.openlibrary.org/b/isbn/9782070408504-L.jpg', 96, '1943-04-06', 'fr'),

-- 5. Dystopie
('1984', 'George Orwell', 'Dystopie',
 'Dans un futur totalitaire, Winston Smith lutte contre la surveillance absolue.',
 '9782070368228', 'https://covers.openlibrary.org/b/isbn/9782070368228-L.jpg', 384, '1949-06-08', 'fr'),

-- 6. Philosophie
('L''Alchimiste', 'Paulo Coelho', 'Philosophie',
 'Un jeune berger parcourt le monde à la recherche de son destin.',
 '9782290004449', 'https://covers.openlibrary.org/b/isbn/9782290004449-L.jpg', 256, '1988-01-01', 'fr'),

-- 7. Classique
('Les Misérables', 'Victor Hugo', 'Classique',
 'Jean Valjean, un ancien bagnard, cherche à se racheter dans la France du XIXe siècle.',
 '9782070409228', 'https://covers.openlibrary.org/b/isbn/9782070409228-L.jpg', 1900, '1862-04-03', 'fr'),

-- 8. Aventure
('Le Comte de Monte-Cristo', 'Alexandre Dumas', 'Aventure',
 'Edmond Dantès, injustement emprisonné, prépare sa vengeance après s''être évadé.',
 '9782070409167', 'https://covers.openlibrary.org/b/isbn/9782070409167-L.jpg', 1276, '1844-08-28', 'fr'),

-- 9. Science-Fiction
('Dune', 'Frank Herbert', 'Science-Fiction',
 'Sur la planète désertique Arrakis, Paul Atréides devient le messie d''un peuple.',
 '9782266232005', 'https://covers.openlibrary.org/b/isbn/9782266232005-L.jpg', 896, '1965-08-01', 'fr'),

-- 10. Policier
('Le Da Vinci Code', 'Dan Brown', 'Policier',
 'Un professeur enquête sur un meurtre au Louvre qui cache des secrets religieux.',
 '9782709624256', 'https://covers.openlibrary.org/b/isbn/9782709624256-L.jpg', 574, '2003-03-18', 'fr'),

-- 11. Romance
('Orgueil et Préjugés', 'Jane Austen', 'Romance',
 'Elizabeth Bennet et Fitzwilliam Darcy s''affrontent avant de tomber amoureux.',
 '9782070413119', 'https://covers.openlibrary.org/b/isbn/9782070413119-L.jpg', 424, '1813-01-28', 'fr'),

-- 12. Horreur
('Ça', 'Stephen King', 'Horreur',
 'Un groupe d''amis affronte une entité maléfique qui terrorise leur ville.',
 '9782226178312', 'https://covers.openlibrary.org/b/isbn/9782226178312-L.jpg', 1376, '1986-09-15', 'fr'),

-- 13. Science-Fiction
('Le Meilleur des mondes', 'Aldous Huxley', 'Science-Fiction',
 'Dans un futur utopique et déshumanisé, un individu refuse le bonheur artificiel.',
 '9782266128568', 'https://covers.openlibrary.org/b/isbn/9782266128568-L.jpg', 288, '1932-01-01', 'fr'),

-- 14. Aventure
('Robinson Crusoé', 'Daniel Defoe', 'Aventure',
 'Un naufragé survit seul sur une île déserte pendant 28 ans.',
 '9782070409020', 'https://covers.openlibrary.org/b/isbn/9782070409020-L.jpg', 336, '1719-04-25', 'fr'),

-- 15. Classique
('Madame Bovary', 'Gustave Flaubert', 'Classique',
 'Emma Bovary, insatisfaite de sa vie bourgeoise, cherche l''amour et l''aventure.',
 '9782070413119', 'https://covers.openlibrary.org/b/isbn/9782253004868-L.jpg', 468, '1857-12-15', 'fr'),

-- 16. Science-Fiction
('Fondation', 'Isaac Asimov', 'Science-Fiction',
 'Un mathématicien tente de préserver la connaissance humaine face à l''effondrement galactique.',
 '9782070360536', 'https://covers.openlibrary.org/b/isbn/9782070360536-L.jpg', 352, '1951-05-01', 'fr'),

-- 17. Fantastique
('Le Lion, la Sorcière Blanche et l''Armoire Magique', 'C.S. Lewis', 'Fantastique',
 'Quatre enfants découvrent un monde magique à travers une armoire.',
 '9782070612987', 'https://covers.openlibrary.org/b/isbn/9782070612987-L.jpg', 192, '1950-10-16', 'fr'),

-- 18. Biographie
('Le Journal d''Anne Frank', 'Anne Frank', 'Biographie',
 'Le journal intime d''une jeune fille juive cachée pendant la Seconde Guerre mondiale.',
 '9782070514484', 'https://covers.openlibrary.org/b/isbn/9782070514484-L.jpg', 340, '1947-06-25', 'fr'),

-- 19. Policier
('Sherlock Holmes : Une étude en rouge', 'Arthur Conan Doyle', 'Policier',
 'La première rencontre entre Sherlock Holmes et le Dr Watson sur une affaire de meurtre.',
 '9782070414383', 'https://covers.openlibrary.org/b/isbn/9782070414383-L.jpg', 192, '1887-11-01', 'fr'),

-- 20. Philosophie
('Le Mythe de Sisyphe', 'Albert Camus', 'Philosophie',
 'Camus explore l''absurde comme condition fondamentale de l''existence humaine.',
 '9782070323227', 'https://covers.openlibrary.org/b/isbn/9782070323227-L.jpg', 187, '1942-10-16', 'fr'),

-- 21. Classique
('L''Étranger', 'Albert Camus', 'Classique',
 'Meursault, un homme indifférent, commet un meurtre et affronte la société.',
 '9782070360024', 'https://covers.openlibrary.org/b/isbn/9782070360024-L.jpg', 185, '1942-06-01', 'fr'),

-- 22. Historique
('Le Nom de la rose', 'Umberto Eco', 'Historique',
 'Un moine franciscain enquête sur des morts mystérieuses dans une abbaye médiévale.',
 '9782246242727', 'https://covers.openlibrary.org/b/isbn/9782246242727-L.jpg', 502, '1980-01-01', 'fr'),

-- 23. Romance
('Jane Eyre', 'Charlotte Brontë', 'Romance',
 'Une orpheline devient gouvernante et tombe amoureuse de son mystérieux employeur.',
 '9782070409396', 'https://covers.openlibrary.org/b/isbn/9782070409396-L.jpg', 576, '1847-10-16', 'fr'),

-- 24. Classique
('Crime et Châtiment', 'Fiodor Dostoïevski', 'Classique',
 'Un étudiant commet un meurtre et est torturé par sa culpabilité.',
 '9782070413126', 'https://covers.openlibrary.org/b/isbn/9782070413126-L.jpg', 672, '1866-01-01', 'fr'),

-- 25. Aventure
('L''île au trésor', 'Robert Louis Stevenson', 'Aventure',
 'Un jeune garçon part à la recherche d''un trésor de pirates.',
 '9782070415267', 'https://covers.openlibrary.org/b/isbn/9782070415267-L.jpg', 288, '1883-11-14', 'fr'),

-- 26. Science-Fiction
('La Guerre des mondes', 'H.G. Wells', 'Science-Fiction',
 'La Terre est envahie par des extraterrestres martiens supérieurement armés.',
 '9782070416530', 'https://covers.openlibrary.org/b/isbn/9782070416530-L.jpg', 256, '1898-01-01', 'fr'),

-- 27. Horreur
('Dracula', 'Bram Stoker', 'Horreur',
 'Le comte Dracula tente de s''installer en Angleterre, et un groupe d''humains lui résiste.',
 '9782070417162', 'https://covers.openlibrary.org/b/isbn/9782070417162-L.jpg', 512, '1897-05-26', 'fr'),

-- 28. Classique
('Les Trois Mousquetaires', 'Alexandre Dumas', 'Classique',
 'D''Artagnan rejoint les célèbres mousquetaires dans des aventures au service du roi.',
 '9782070409211', 'https://covers.openlibrary.org/b/isbn/9782070409211-L.jpg', 768, '1844-03-14', 'fr'),

-- 29. Développement personnel
('L''Art de la guerre', 'Sun Tzu', 'Développement personnel',
 'Un traité de stratégie militaire applicable à la vie et aux affaires.',
 '9782290349229', 'https://covers.openlibrary.org/b/isbn/9782290349229-L.jpg', 128, '0500-01-01', 'fr'),

-- 30. Romance
('Autant en emporte le vent', 'Margaret Mitchell', 'Romance',
 'Scarlett O''Hara survit à la guerre de Sécession et à ses propres passions.',
 '9782070418527', 'https://covers.openlibrary.org/b/isbn/9782070418527-L.jpg', 1037, '1936-06-30', 'fr'),

-- 31. Science-Fiction
('Fahrenheit 451', 'Ray Bradbury', 'Science-Fiction',
 'Dans un futur où les livres sont interdits, un pompier se rebelle.',
 '9782070419036', 'https://covers.openlibrary.org/b/isbn/9782070419036-L.jpg', 256, '1953-10-19', 'fr'),

-- 32. Fantastique
('Les Chroniques de Narnia : Le Prince Caspian', 'C.S. Lewis', 'Fantastique',
 'Les enfants Pevensie retournent à Narnia pour aider le prince Caspian.',
 '9782070612994', 'https://covers.openlibrary.org/b/isbn/9782070612994-L.jpg', 224, '1951-10-15', 'fr'),

-- 33. Policier
('Et il ne restera que poussière', 'Agatha Christie', 'Policier',
 'Hercule Poirot enquête sur un meurtre dans un isolement total.',
 '9782702495872', 'https://covers.openlibrary.org/b/isbn/9782702495872-L.jpg', 288, '1939-11-06', 'fr'),

-- 34. Aventure
('Vingt mille lieues sous les mers', 'Jules Verne', 'Aventure',
 'Un professeur explore les fonds marins à bord du Nautilus du capitaine Nemo.',
 '9782070413034', 'https://covers.openlibrary.org/b/isbn/9782070413034-L.jpg', 448, '1870-06-20', 'fr'),

-- 35. Science-Fiction
('Le Voyageur imprudent', 'René Barjavel', 'Science-Fiction',
 'Un homme voyage dans le temps et provoque des paradoxes dévastateurs.',
 '9782266030625', 'https://covers.openlibrary.org/b/isbn/9782266030625-L.jpg', 256, '1944-01-01', 'fr'),

-- 36. Romance
('Les Hauts de Hurlevent', 'Emily Brontë', 'Romance',
 'L''histoire passionnée et destructrice entre Heathcliff et Catherine.',
 '9782070413102', 'https://covers.openlibrary.org/b/isbn/9782070413102-L.jpg', 416, '1847-12-01', 'fr'),

-- 37. Policier
('Le Meurtre de Roger Ackroyd', 'Agatha Christie', 'Policier',
 'Hercule Poirot résout un meurtre dans un village anglais avec un twist inattendu.',
 '9782702495889', 'https://covers.openlibrary.org/b/isbn/9782702495889-L.jpg', 288, '1926-06-01', 'fr'),

-- 38. Classique
('De la Terre à la Lune', 'Jules Verne', 'Classique',
 'Des savants américains construisent un canon pour envoyer des hommes sur la Lune.',
 '9782070413041', 'https://covers.openlibrary.org/b/isbn/9782070413041-L.jpg', 224, '1865-10-14', 'fr'),

-- 39. Développement personnel
('Les 7 habitudes des gens très efficaces', 'Stephen Covey', 'Développement personnel',
 'Un guide pratique pour développer son efficacité personnelle et professionnelle.',
 '9782744500466', 'https://covers.openlibrary.org/b/isbn/9782744500466-L.jpg', 375, '1989-08-15', 'fr'),

-- 40. Classique
('Germinal', 'Émile Zola', 'Classique',
 'La vie des mineurs du Nord de la France et leur lutte pour la survie.',
 '9782070413225', 'https://covers.openlibrary.org/b/isbn/9782070413225-L.jpg', 591, '1885-03-02', 'fr'),

-- 41. Fantastique
('L''Histoire sans fin', 'Michael Ende', 'Fantastique',
 'Un garçon solitaire est aspiré dans le monde d''un livre magique.',
 '9782070579877', 'https://covers.openlibrary.org/b/isbn/9782070579877-L.jpg', 460, '1979-09-01', 'fr'),

-- 42. Horreur
('Shining', 'Stephen King', 'Horreur',
 'Un écrivain, gardien d''un hôtel isolé en hiver, sombre dans la folie.',
 '9782226167811', 'https://covers.openlibrary.org/b/isbn/9782226167811-L.jpg', 630, '1977-01-28', 'fr'),

-- 43. Science-Fiction
('Les Robots', 'Isaac Asimov', 'Science-Fiction',
 'Recueil de nouvelles explorant les relations entre humains et robots intelligents.',
 '9782070360543', 'https://covers.openlibrary.org/b/isbn/9782070360543-L.jpg', 288, '1950-12-02', 'fr'),

-- 44. Policier
('L''Assassin royal : L''apprenti assassin', 'Robin Hobb', 'Fantastique',
 'Fitz, fils bâtard du prince royal, est formé comme assassin secret.',
 '9782290349236', 'https://covers.openlibrary.org/b/isbn/9782290349236-L.jpg', 512, '1995-01-01', 'fr'),

-- 45. Classique
('Notre-Dame de Paris', 'Victor Hugo', 'Classique',
 'Quasimodo, le sonneur de cloches bossu, est épris de la belle Esmeralda.',
 '9782070413232', 'https://covers.openlibrary.org/b/isbn/9782070413232-L.jpg', 668, '1831-03-16', 'fr'),

-- 46. Développement personnel
('Père riche, père pauvre', 'Robert Kiyosaki', 'Développement personnel',
 'Ce que les riches enseignent à leurs enfants sur l''argent que les pauvres ne font pas.',
 '9782744501142', 'https://covers.openlibrary.org/b/isbn/9782744501142-L.jpg', 304, '1997-04-01', 'fr'),

-- 47. Historique
('Les Piliers de la Terre', 'Ken Follett', 'Historique',
 'La construction d''une cathédrale au Moyen Âge au cœur de guerres et intrigues.',
 '9782253046752', 'https://covers.openlibrary.org/b/isbn/9782253046752-L.jpg', 1056, '1989-09-01', 'fr'),

-- 48. Science-Fiction
('Ender''s Game : La Stratégie Ender', 'Orson Scott Card', 'Science-Fiction',
 'Un enfant prodige est formé pour diriger l''armée humaine contre une invasion alien.',
 '9782266102674', 'https://covers.openlibrary.org/b/isbn/9782266102674-L.jpg', 352, '1985-01-15', 'fr'),

-- 49. Romance
('Le Choix de Sophie', 'William Styron', 'Romance',
 'Une rescapée d''Auschwitz vit un amour douloureux hanté par son passé.',
 '9782070419197', 'https://covers.openlibrary.org/b/isbn/9782070419197-L.jpg', 712, '1979-05-27', 'fr'),

-- 50. Fantastique
('Coraline', 'Neil Gaiman', 'Fantastique',
 'Une fillette découvre un monde parallèle qui ressemble au sien mais en plus inquiétant.',
 '9782070628063', 'https://covers.openlibrary.org/b/isbn/9782070628063-L.jpg', 192, '2002-07-02', 'fr');
