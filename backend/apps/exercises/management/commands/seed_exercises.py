from django.core.management.base import BaseCommand
from apps.exercises.models import Exercise, MuscleGroup

EXERCISES: list[dict[str, str]] = [
    # Chest
    {"name": "Bench Press", "muscle_group": MuscleGroup.CHEST,
     "description": "Deitado no banco reto, desça a barra até o peito e empurre para cima. Mantenha os ombros retraídos e os pés firmes no chão."},
    {"name": "Incline Bench Press", "muscle_group": MuscleGroup.CHEST,
     "description": "Banco inclinado a 30-45°. Trabalha mais a porção clavicular do peitoral. Desça a barra controlada até a parte superior do peito."},
    {"name": "Decline Bench Press", "muscle_group": MuscleGroup.CHEST,
     "description": "Banco declinado. Enfatiza a porção inferior do peitoral. Desça a barra até a parte inferior do peito mantendo controle."},
    {"name": "Cable Fly", "muscle_group": MuscleGroup.CHEST,
     "description": "Em pé entre dois cabos altos, traga as mãos à frente do corpo em arco amplo. Mantenha leve flexão nos cotovelos durante todo o movimento."},
    {"name": "Push-Up", "muscle_group": MuscleGroup.CHEST,
     "description": "Em posição de prancha, desça o corpo até o peito quase tocar o chão e empurre de volta. Mantenha o core ativado e a coluna alinhada."},
    {"name": "Dumbbell Fly", "muscle_group": MuscleGroup.CHEST,
     "description": "Deitado no banco com halteres, abra os braços em arco mantendo leve flexão nos cotovelos. Sinta o alongamento do peitoral e retorne."},

    # Back
    {"name": "Pull-Up", "muscle_group": MuscleGroup.BACK,
     "description": "Pendure-se na barra com pegada pronada, puxe o peito em direção à barra. Inicie o movimento pelas escápulas. Controle a descida."},
    {"name": "Lat Pulldown", "muscle_group": MuscleGroup.BACK,
     "description": "Sentado, puxe a barra até a parte superior do peito. Mantenha o tronco levemente inclinado para trás e os cotovelos próximos ao corpo."},
    {"name": "Seated Cable Row", "muscle_group": MuscleGroup.BACK,
     "description": "Sentado com pés apoiados, puxe o cabo em direção ao abdômen. Retraia as escápulas no final do movimento. Não use impulso do tronco."},
    {"name": "Bent-Over Row", "muscle_group": MuscleGroup.BACK,
     "description": "Tronco inclinado a 45°, puxe a barra em direção ao umbigo. Mantenha as costas retas e o core ativado durante toda a execução."},
    {"name": "T-Bar Row", "muscle_group": MuscleGroup.BACK,
     "description": "Com a barra T entre as pernas, puxe os pesos em direção ao peito. Trabalha a espessura do meio das costas."},
    {"name": "Face Pull", "muscle_group": MuscleGroup.BACK,
     "description": "Cabo na altura do rosto com corda. Puxe em direção à testa, separando as mãos no final. Ótimo para postura e ombros."},

    # Shoulders
    {"name": "Overhead Press", "muscle_group": MuscleGroup.SHOULDERS,
     "description": "Em pé, empurre a barra do nível dos ombros até a extensão total acima da cabeça. Mantenha o core firme e os glúteos contraídos."},
    {"name": "Lateral Raise", "muscle_group": MuscleGroup.SHOULDERS,
     "description": "Em pé com halteres ao lado do corpo, eleve os braços lateralmente até a altura dos ombros. Movimento controlado, sem impulso."},
    {"name": "Front Raise", "muscle_group": MuscleGroup.SHOULDERS,
     "description": "Eleve os halteres à frente do corpo até a altura dos ombros. Trabalha a porção anterior do deltoide. Evite balanço."},
    {"name": "Reverse Fly", "muscle_group": MuscleGroup.SHOULDERS,
     "description": "Tronco inclinado, abra os halteres em arco para os lados. Foca no deltoide posterior. Mantenha leve flexão nos cotovelos."},
    {"name": "Arnold Press", "muscle_group": MuscleGroup.SHOULDERS,
     "description": "Halteres começam na frente com palmas viradas para você. Rotacione enquanto empurra acima da cabeça. Trabalha todas as cabeças do deltoide."},

    # Biceps
    {"name": "Barbell Curl", "muscle_group": MuscleGroup.BICEPS,
     "description": "Em pé com barra, flexione os cotovelos trazendo a barra ao peito. Mantenha os cotovelos fixos ao lado do corpo durante todo o movimento."},
    {"name": "Dumbbell Curl", "muscle_group": MuscleGroup.BICEPS,
     "description": "Em pé com halteres, flexione um braço por vez ou alternados. Supine o punho ao subir para máxima ativação do bíceps."},
    {"name": "Hammer Curl", "muscle_group": MuscleGroup.BICEPS,
     "description": "Halteres com pegada neutra (polegares para cima). Flexione mantendo essa pegada. Trabalha o braquial e o braquiorradial junto ao bíceps."},
    {"name": "Concentration Curl", "muscle_group": MuscleGroup.BICEPS,
     "description": "Sentado com o cotovelo apoiado na parte interna da coxa, flexione o halter até o ombro. Foco máximo no pico do bíceps."},
    {"name": "Preacher Curl", "muscle_group": MuscleGroup.BICEPS,
     "description": "Braços apoiados no banco Scott, flexione a barra ou halter. Isola o bíceps eliminando impulso do corpo."},

    # Triceps
    {"name": "Triceps Pushdown", "muscle_group": MuscleGroup.TRICEPS,
     "description": "Em pé na polia alta, empurre a barra ou corda para baixo até a extensão total dos cotovelos. Mantenha os cotovelos próximos ao corpo."},
    {"name": "Skull Crusher", "muscle_group": MuscleGroup.TRICEPS,
     "description": "Deitado no banco, desça a barra em direção à testa flexionando apenas os cotovelos. Estenda os braços de volta sem movê-los."},
    {"name": "Overhead Triceps Extension", "muscle_group": MuscleGroup.TRICEPS,
     "description": "Halter ou corda acima da cabeça. Desça atrás da cabeça flexionando os cotovelos, depois estenda. Mantém os tríceps alongados."},
    {"name": "Close-Grip Bench Press", "muscle_group": MuscleGroup.TRICEPS,
     "description": "Supino com pegada na largura dos ombros. Cotovelos próximos ao corpo. Foco no tríceps com participação do peito interno."},
    {"name": "Dips", "muscle_group": MuscleGroup.TRICEPS,
     "description": "Nas paralelas, desça flexionando os cotovelos até 90°. Mantenha o tronco vertical para focar no tríceps; inclinado foca peito."},

    # Legs
    {"name": "Squat", "muscle_group": MuscleGroup.LEGS,
     "description": "Com a barra apoiada no trapézio, desça flexionando quadril e joelhos até as coxas ficarem paralelas ao chão. Mantenha o core firme."},
    {"name": "Leg Press", "muscle_group": MuscleGroup.LEGS,
     "description": "Sentado no aparelho, empurre a plataforma com os pés na largura dos ombros. Desça até 90° nos joelhos, sem destacar a lombar."},
    {"name": "Romanian Deadlift", "muscle_group": MuscleGroup.LEGS,
     "description": "Com a barra à frente, desça empurrando o quadril para trás e mantendo as pernas levemente flexionadas. Trabalha posteriores e glúteo."},
    {"name": "Leg Extension", "muscle_group": MuscleGroup.LEGS,
     "description": "Sentado no aparelho, estenda os joelhos até a extensão completa. Isola o quadríceps. Controle a descida."},
    {"name": "Leg Curl", "muscle_group": MuscleGroup.LEGS,
     "description": "Deitado de bruços ou sentado, flexione os joelhos contra o rolo. Isola os posteriores de coxa. Foco na contração."},
    {"name": "Calf Raise", "muscle_group": MuscleGroup.LEGS,
     "description": "Em pé com a ponta dos pés em um degrau, eleve os calcanhares ao máximo e desça abaixo da linha. Trabalha a panturrilha."},

    # Glutes
    {"name": "Hip Thrust", "muscle_group": MuscleGroup.GLUTES,
     "description": "Com as costas apoiadas em um banco e barra no quadril, eleve o quadril até alinhar com tronco e joelhos. Contraia os glúteos no topo."},
    {"name": "Glute Bridge", "muscle_group": MuscleGroup.GLUTES,
     "description": "Deitado no chão com joelhos flexionados, eleve o quadril contraindo os glúteos. Versão sem carga, ótima para ativação."},
    {"name": "Cable Kickback", "muscle_group": MuscleGroup.GLUTES,
     "description": "Em pé na polia baixa com tornozeleira, estenda a perna para trás contra a resistência. Mantenha o tronco estável."},
    {"name": "Bulgarian Split Squat", "muscle_group": MuscleGroup.GLUTES,
     "description": "Com um pé apoiado atrás em um banco, agache com a perna da frente. Trabalha glúteo e quadríceps unilateralmente."},

    # Core
    {"name": "Plank", "muscle_group": MuscleGroup.CORE,
     "description": "Apoie-se nos antebraços e pontas dos pés, mantendo o corpo reto da cabeça aos calcanhares. Segure pelo tempo planejado."},
    {"name": "Crunch", "muscle_group": MuscleGroup.CORE,
     "description": "Deitado de costas, eleve o tronco contraindo o abdômen. Não puxe o pescoço; o movimento vem da contração abdominal."},
    {"name": "Leg Raise", "muscle_group": MuscleGroup.CORE,
     "description": "Deitado ou pendurado na barra, eleve as pernas até 90°. Foca no abdômen inferior. Evite balanço."},
    {"name": "Russian Twist", "muscle_group": MuscleGroup.CORE,
     "description": "Sentado com tronco inclinado e pés levemente elevados, gire o tronco de lado a lado. Trabalha os oblíquos."},
    {"name": "Dead Bug", "muscle_group": MuscleGroup.CORE,
     "description": "Deitado de costas com braços e pernas elevados, estenda braço e perna opostos sem encostar o chão. Excelente para estabilidade do core."},

    # Cardio
    {"name": "Running", "muscle_group": MuscleGroup.CARDIO,
     "description": "Corrida em ritmo constante. Pise com o meio do pé, mantenha cadência confortável e respiração regular."},
    {"name": "Rowing Machine", "muscle_group": MuscleGroup.CARDIO,
     "description": "Sequência: empurrar com as pernas, inclinar tronco, puxar com os braços. Inverter na volta. Trabalha corpo inteiro."},
    {"name": "Jump Rope", "muscle_group": MuscleGroup.CARDIO,
     "description": "Pule a corda com os pés juntos, batendo o chão com a ponta dos pés. Use o pulso para girar a corda."},
    {"name": "Cycling", "muscle_group": MuscleGroup.CARDIO,
     "description": "Pedalada em bicicleta ergométrica ou estrada. Mantenha cadência entre 80-100 rpm para treino aeróbico eficiente."},

    # Full Body
    {"name": "Deadlift", "muscle_group": MuscleGroup.FULL_BODY,
     "description": "Com a barra no chão, agache mantendo as costas retas, segure e suba estendendo quadril e joelhos juntos. Rei dos exercícios."},
    {"name": "Burpee", "muscle_group": MuscleGroup.FULL_BODY,
     "description": "Agache, jogue as pernas pra trás (prancha), faça uma flexão, traga as pernas de volta e salte. Sequência sem pausa."},
    {"name": "Clean and Press", "muscle_group": MuscleGroup.FULL_BODY,
     "description": "Levante a barra do chão até os ombros (clean) e empurre acima da cabeça (press). Movimento olímpico potente."},
    {"name": "Kettlebell Swing", "muscle_group": MuscleGroup.FULL_BODY,
     "description": "Segure o kettlebell com as duas mãos, balance entre as pernas e use o quadril para impulsioná-lo até a altura dos ombros."},
]


class Command(BaseCommand):
    help = "Seeds the database with a base exercise catalog (idempotent, updates descriptions on re-run)."

    def add_arguments(self, parser) -> None:
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Delete all existing exercises before seeding.",
        )

    def handle(self, *args, **options) -> None:
        if options["clear"]:
            count, _ = Exercise.objects.all().delete()
            self.stdout.write(self.style.WARNING(f"Deleted {count} existing exercises."))

        created_count = 0
        updated_count = 0

        for data in EXERCISES:
            _, created = Exercise.objects.update_or_create(
                name=data["name"],
                defaults={
                    "muscle_group": data["muscle_group"],
                    "description": data["description"],
                },
            )
            if created:
                self.stdout.write(f"  Created  → {data['name']}")
                created_count += 1
            else:
                self.stdout.write(f"  Updated  → {data['name']}")
                updated_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"\nDone. {created_count} created, {updated_count} updated."
            )
        )
