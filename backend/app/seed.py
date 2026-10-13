"""Initialise les données de démonstration.

Usage :
    python -m app.seed           # insère les données si la base est vide
    python -m app.seed --reset   # supprime les tickets/utilisateurs puis réinsère
"""

import argparse
import logging
from datetime import UTC, datetime, timedelta

from sqlalchemy import delete, func, select

from app.database import SessionLocal
from app.models import Ticket, TicketPriority, TicketStatus, User, UserRole
from app.security import hash_password

logger = logging.getLogger("helpdesk.seed")

DEMO_USERS = [
    ("admin@helpdesk.local", "Alice Martin", "admin123", UserRole.admin),
    ("agent@helpdesk.local", "Karim Benali", "agent123", UserRole.agent),
    ("user@helpdesk.local", "Sophie Durand", "user123", UserRole.user),
    ("lucas@helpdesk.local", "Lucas Petit", "user123", UserRole.user),
]

# (titre, description, priorité, statut, email du demandeur, ancienneté en heures)
DEMO_TICKETS = [
    ("Impossible de se connecter au VPN",
     "Depuis ce matin, le client VPN affiche « Erreur d'authentification 809 ». J'ai redémarré le poste sans succès.",
     TicketPriority.high, TicketStatus.open, "user@helpdesk.local", 2),
    ("L'imprimante du 2e étage n'imprime plus",
     "L'imprimante HP du couloir B affiche « Bourrage papier » alors qu'aucune feuille n'est coincée.",
     TicketPriority.medium, TicketStatus.in_progress, "lucas@helpdesk.local", 26),
    ("Demande d'accès au dossier partagé Comptabilité",
     "J'ai besoin d'un accès en lecture au dossier \\\\srv-fichiers\\Comptabilite pour la clôture mensuelle.",
     TicketPriority.low, TicketStatus.resolved, "user@helpdesk.local", 72),
    ("Serveur de messagerie très lent",
     "Les emails mettent plus de 10 minutes à arriver. Plusieurs collègues du service commercial sont concernés.",
     TicketPriority.critical, TicketStatus.in_progress, "lucas@helpdesk.local", 5),
    ("Écran qui scintille",
     "Mon second écran Dell scintille par intermittence. J'ai essayé un autre câble HDMI.",
     TicketPriority.low, TicketStatus.open, "user@helpdesk.local", 30),
    ("Mot de passe expiré sur l'ERP",
     "Le système me demande de changer mon mot de passe mais refuse tous ceux que je propose.",
     TicketPriority.medium, TicketStatus.resolved, "lucas@helpdesk.local", 96),
    ("Installation de Visual Studio Code",
     "Merci d'installer VS Code avec l'extension Python sur mon poste (PC-DEV-042).",
     TicketPriority.low, TicketStatus.open, "user@helpdesk.local", 8),
    ("Site intranet inaccessible",
     "L'intranet renvoie une erreur 502 Bad Gateway pour tout le monde depuis 9h15.",
     TicketPriority.critical, TicketStatus.open, "lucas@helpdesk.local", 1),
    ("Téléphone IP sans tonalité",
     "Le téléphone du bureau 114 n'a plus de tonalité. Le voyant réseau est éteint.",
     TicketPriority.medium, TicketStatus.open, "user@helpdesk.local", 50),
    ("Sauvegarde nocturne en échec",
     "Le rapport de sauvegarde indique un échec sur le volume D: du serveur SRV-APP-01 depuis deux nuits.",
     TicketPriority.high, TicketStatus.in_progress, "agent@helpdesk.local", 40),
    ("Nouveau collaborateur : création de compte",
     "Arrivée de Marie Leroy lundi au service RH. Prévoir compte AD, messagerie et badge.",
     TicketPriority.medium, TicketStatus.resolved, "admin@helpdesk.local", 120),
    ("Licence Office non activée",
     "Word affiche « Produit sans licence » et passe en mode lecture seule.",
     TicketPriority.high, TicketStatus.open, "user@helpdesk.local", 4),
]


def seed(reset: bool = False) -> None:
    with SessionLocal() as db:
        if reset:
            db.execute(delete(Ticket))
            db.execute(delete(User))
            db.commit()
            logger.info("Données existantes supprimées.")

        if db.scalar(select(func.count()).select_from(User)):
            logger.info("La base contient déjà des utilisateurs : initialisation ignorée (utilisez --reset).")
            return

        users = {}
        for email, name, password, role in DEMO_USERS:
            user = User(email=email, full_name=name, password_hash=hash_password(password), role=role)
            db.add(user)
            users[email] = user
        db.flush()

        now = datetime.now(UTC)
        for title, desc, prio, status, email, age_hours in DEMO_TICKETS:
            created = now - timedelta(hours=age_hours)
            db.add(Ticket(
                title=title, description=desc, priority=prio, status=status,
                requester_id=users[email].id, created_at=created, updated_at=created,
            ))
        db.commit()
        logger.info("%d utilisateurs et %d tickets de démonstration créés.", len(DEMO_USERS), len(DEMO_TICKETS))


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    parser = argparse.ArgumentParser(description="Initialise les données de démonstration HelpDesk.")
    parser.add_argument("--reset", action="store_true", help="Vide les tables avant de réinsérer les données.")
    seed(reset=parser.parse_args().reset)
