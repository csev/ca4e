import math

# https://e6bx.com/e6b/
# https://www.mathsisfun.com/algebra/trig-solving-aas-triangles.html
# https://www.youtube.com/watch?v=yC0Dmbge8Xs
# https://www.youtube.com/watch?v=z2XAPkkDDrk

course = 0
tas = 100
wind = 15
for wind_from in [0, 30, 60, 90, 120, 135, 180, 225, 270, 360] :

    wa = (180 - wind_from) % 360

    if wa == 0:
        drift = 0
        gs = tas + wind
    elif wa == 180:
        drift = 0
        gs = tas - wind
    else:
        drift = math.degrees(math.asin(math.sin(math.radians(wa)) / tas * wind))
        gsa = 180 - ((wa % 180) + drift)
        gs = math.fabs((wind * math.sin(math.radians(gsa))) / math.sin(math.radians(drift)))

    print(wind_from, round(drift), round(gs))
