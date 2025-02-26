// Crawl Planets
//
// Capture unowned planets around you!
// 预设值从4级到9级，能量百分比90%，每次最多捕获10个星球
// 增加自动执行功能，每30秒执行一次（可以取消）

import { EMPTY_ADDRESS } from "https://cdn.skypack.dev/@darkforest_eth/constants";
import {
    PlanetType,
    PlanetTypeNames,
    PlanetLevel,
    PlanetLevelNames,
} from "https://cdn.skypack.dev/@darkforest_eth/types";

const players = [
    EMPTY_ADDRESS
];


class Plugin {
    constructor() {
        this.planetType = PlanetType.SILVER_MINE;
        this.minimumEnergyAllowed = 5;
        this.minPlanetLevelTo = PlanetLevel.FOUR;
        this.maxPlanetLevelTo = PlanetLevel.NINE;
        this.minPlanetLevelFrom = PlanetLevel.ZERO;
        this.maxPlanetLevelFrom = PlanetLevel.SIX;
        this.maxEnergyPercent = 90;
        this.maxPlanetsToSendFromLog2 = 5;  // 32 planets = 2**5
        this.maxCaptureCount = 10;  // 新增：最大捕获数量限制
    }
    render(container) {
        container.style.width = '400px';

        let stepperLabel = document.createElement('label');
        stepperLabel.innerText = 'Max % energy to spend';
        stepperLabel.style.display = 'block';

        let stepper = document.createElement('input');
        stepper.type = 'range';
        stepper.min = '0';
        stepper.max = '100';
        stepper.step = '5';
        stepper.value = `${this.maxEnergyPercent}`;
        stepper.style.width = '80%';
        stepper.style.height = '24px';

        let percent = document.createElement('span');
        percent.innerText = `${stepper.value}%`;
        percent.style.float = 'right';

        stepper.onchange = (evt) => {
            percent.innerText = `${evt.target.value}%`;
            try {
                this.maxEnergyPercent = parseInt(evt.target.value, 10);
            } catch (e) {
                console.error('could not parse energy percent', e);
            }
        }

        let minimumEnergyAllowedLabel = document.createElement('label');
        minimumEnergyAllowedLabel.innerText = '% energy to fill after capture';
        minimumEnergyAllowedLabel.style.display = 'block';

        let minimumEnergyAllowedSelect = document.createElement('input');
        minimumEnergyAllowedSelect.type = 'range';
        minimumEnergyAllowedSelect.min = '0';
        minimumEnergyAllowedSelect.max = '100';
        minimumEnergyAllowedSelect.step = '1';
        minimumEnergyAllowedSelect.value = `${this.minimumEnergyAllowed}`;
        minimumEnergyAllowedSelect.style.width = '80%';
        minimumEnergyAllowedSelect.style.height = '24px';

        let percentminimumEnergyAllowed = document.createElement('span');
        percentminimumEnergyAllowed.innerText = `${minimumEnergyAllowedSelect.value}%`;
        percentminimumEnergyAllowed.style.float = 'right';

        minimumEnergyAllowedSelect.onchange = (evt) => {
            if (parseInt(evt.target.value, 10) === 0) percentminimumEnergyAllowed.innerText = `1 energy`;
            else
                percentminimumEnergyAllowed.innerText = `${evt.target.value}%`;
            try {
                this.minimumEnergyAllowed = parseInt(evt.target.value, 10);
            } catch (e) {
                console.error('could not parse minimum energy allowed percent', e);
            }
        }

        let minLevelToLabel = document.createElement('label');
        minLevelToLabel.innerText = 'Min. level to capture';
        minLevelToLabel.style.display = 'block';

        let minLevelTo = document.createElement('select');
        minLevelTo.style.background = 'rgb(8,8,8)';
        minLevelTo.style.width = '100%';
        minLevelTo.style.marginTop = '10px';
        minLevelTo.style.marginBottom = '10px';
        Object.entries(PlanetLevel).forEach(([name, lvl]) => {
            let opt = document.createElement('option');
            opt.value = `${lvl}`;
            opt.innerText = `${PlanetLevelNames[lvl]}`;
            minLevelTo.appendChild(opt);
        });
        minLevelTo.value = `${this.minPlanetLevelTo}`;

        minLevelTo.onchange = (evt) => {
            try {
                this.minPlanetLevelTo = parseInt(evt.target.value, 10);
            } catch (e) {
                console.error('could not parse planet level', e);
            }
        }

        let maxLevelToLabel = document.createElement('label');
        maxLevelToLabel.innerText = 'Max. level to capture';
        maxLevelToLabel.style.display = 'block';

        let maxLevelTo = document.createElement('select');
        maxLevelTo.style.background = 'rgb(8,8,8)';
        maxLevelTo.style.width = '100%';
        maxLevelTo.style.marginTop = '10px';
        maxLevelTo.style.marginBottom = '10px';
        Object.entries(PlanetLevel).forEach(([name, lvl]) => {
            let opt = document.createElement('option');
            opt.value = `${lvl}`;
            opt.innerText = `${PlanetLevelNames[lvl]}`;
            maxLevelTo.appendChild(opt);
        });
        maxLevelTo.value = `${this.maxPlanetLevelTo}`;

        maxLevelTo.onchange = (evt) => {
            try {
                this.maxPlanetLevelTo = parseInt(evt.target.value, 10);
            } catch (e) {
                console.error('could not parse planet level', e);
            }
        }

        let maxPlanetsLog2StepperLabel = document.createElement("label");
        maxPlanetsLog2StepperLabel.innerText = "Max number of planets to send energy from";
        maxPlanetsLog2StepperLabel.style.display = "block";

        let maxPlanetsLog2Stepper = document.createElement("input");
        maxPlanetsLog2Stepper.type = "range";
        maxPlanetsLog2Stepper.min = "0";
        maxPlanetsLog2Stepper.max = "10";
        maxPlanetsLog2Stepper.step = "1";
        maxPlanetsLog2Stepper.value = `${this.maxPlanetsToSendFromLog2}`;
        maxPlanetsLog2Stepper.style.width = "80%";
        maxPlanetsLog2Stepper.style.height = "24px";

        let maxPlanetsValue = document.createElement("span");
        maxPlanetsValue.innerText = `${2 ** parseInt(maxPlanetsLog2Stepper.value, 10)}`;
        maxPlanetsValue.style.float = "right";

        maxPlanetsLog2Stepper.onchange = (evt) => {
            maxPlanetsValue.innerText = `${2 ** parseInt(evt.target.value)}`;
            try {
                this.maxPlanetsToSendFromLog2 = parseInt(evt.target.value, 10);
            } catch (e) {
                console.error("could not parse max planets to send from", e);
            }
        };

        let levelLabelFromMin = document.createElement('label');
        levelLabelFromMin.innerText = 'Min. level to send energy from';
        levelLabelFromMin.style.display = 'block';

        let levelFromMin = document.createElement('select');
        levelFromMin.style.background = 'rgb(8,8,8)';
        levelFromMin.style.width = '100%';
        levelFromMin.style.marginTop = '10px';
        levelFromMin.style.marginBottom = '10px';
        Object.entries(PlanetLevel).forEach(([name, lvl]) => {
            let opt = document.createElement('option');
            opt.value = `${lvl}`;
            opt.innerText = `${PlanetLevelNames[lvl]}`;
            levelFromMin.appendChild(opt);
        });
        levelFromMin.value = `${this.minPlanetLevelFrom}`;

        levelFromMin.onchange = (evt) => {
            try {
                this.minPlanetLevelFrom = parseInt(evt.target.value, 10);
            } catch (e) {
                console.error('could not parse planet level', e);
            }
        }

        let levelLabelFromMax = document.createElement('label');
        levelLabelFromMax.innerText = 'Max. level to send energy from';
        levelLabelFromMax.style.display = 'block';

        let levelFromMax = document.createElement('select');
        levelFromMax.style.background = 'rgb(8,8,8)';
        levelFromMax.style.width = '100%';
        levelFromMax.style.marginTop = '10px';
        levelFromMax.style.marginBottom = '10px';
        Object.entries(PlanetLevel).forEach(([name, lvl]) => {
            let opt = document.createElement('option');
            opt.value = `${lvl}`;
            opt.innerText = `${PlanetLevelNames[lvl]}`;
            levelFromMax.appendChild(opt);
        });
        levelFromMax.value = `${this.maxPlanetLevelFrom}`;

        levelFromMax.onchange = (evt) => {
            try {
                this.maxPlanetLevelFrom = parseInt(evt.target.value, 10);
            } catch (e) {
                console.error('could not parse planet level', e);
            }
        }

        let planetTypeLabel = document.createElement('label');
        planetTypeLabel.innerText = 'Planet type to capture';
        planetTypeLabel.style.display = 'block';

        let planetType = document.createElement('select');
        planetType.style.background = 'rgb(8,8,8)';
        planetType.style.width = '100%';
        planetType.style.marginTop = '10px';
        planetType.style.marginBottom = '10px';
        Object.entries(PlanetType).forEach(([name, key]) => {
            let opt = document.createElement('option');
            opt.value = `${key}`;
            opt.innerText = `${PlanetTypeNames[key]}`;
            planetType.appendChild(opt);
        });
        planetType.value = `${this.planetType}`;

        planetType.onchange = (evt) => {
            try {
                this.planetType = parseInt(evt.target.value, 10);
            } catch (e) {
                console.error('could not parse planet planet type', e);
            }
        }

        let message = document.createElement('div');

        let button = document.createElement('button');
        button.style.width = '100%';
        button.style.marginBottom = '10px';
        button.innerHTML = 'Crawl from selected!'
        button.onclick = () => {
            let planet = ui.getSelectedPlanet();
            if (planet) {
                message.innerText = 'Please wait...';
                let moves = capturePlanets(
                    planet.locationId,
                    this.minPlanetLevelTo,
                    this.maxPlanetLevelTo,
                    this.maxEnergyPercent,
                    this.planetType,
                    this.minimumEnergyAllowed,
                    this.maxCaptureCount
                );
                message.innerText = `Crawling ${moves} ${PlanetTypeNames[this.planetType]}s.`;
            } else {
                message.innerText = 'No planet selected.';
            }
        }

        let globalButton = document.createElement('button');
        globalButton.style.width = '100%';
        globalButton.style.marginBottom = '10px';
        globalButton.innerHTML = 'Crawl everything near selected!'
        globalButton.onclick = () => {
            message.innerText = "Please wait...";
            let selectedPlanet = ui.getSelectedPlanet();
            if (selectedPlanet) {
                let totalMoves = 0;
                let planetList = df.getMyPlanets()
                    .filter((planet) => planet.planetLevel >= this.minPlanetLevelFrom && planet.planetLevel <= this.maxPlanetLevelFrom)
                    .map((planet) => [planet, distance(selectedPlanet, planet)])
                    .sort((planetArr1, planetArr2) => planetArr1[1] - planetArr2[1])
                    .map((planetArr) => planetArr[0])
                    .slice(0, 2 ** parseInt(this.maxPlanetsToSendFromLog2, 10))
                    .forEach((planet, idx, arr) => {
                        setTimeout(() => {
                            if (totalMoves < this.maxCaptureCount) {
                                let remainingCaptures = this.maxCaptureCount - totalMoves;
                                let moves = capturePlanets(
                                    planet.locationId,
                                    this.minPlanetLevelTo,
                                    this.maxPlanetLevelTo,
                                    this.maxEnergyPercent,
                                    this.planetType,
                                    this.minimumEnergyAllowed,
                                    remainingCaptures
                                );
                                totalMoves += moves;
                                message.innerText = `Crawling ${totalMoves} ${PlanetTypeNames[this.planetType]}${totalMoves===1?'':'s'} from ${arr.length} Planet${arr.length===1?'':'s'}`;
                            }
                        }, 0);
                    });
            } else {
                message.innerText = `Please select a planet to centre the crawl upon`;
            }
        };

        container.appendChild(stepperLabel);
        container.appendChild(stepper);
        container.appendChild(percent);
        container.appendChild(minimumEnergyAllowedLabel);
        container.appendChild(minimumEnergyAllowedSelect);
        container.appendChild(percentminimumEnergyAllowed);
        container.appendChild(minLevelToLabel);
        container.appendChild(minLevelTo);
        container.appendChild(maxLevelToLabel);
        container.appendChild(maxLevelTo);
        container.appendChild(planetTypeLabel);
        container.appendChild(planetType);
        container.appendChild(button);
        container.append(document.createElement("br"), document.createElement("br"));
        container.appendChild(maxPlanetsLog2StepperLabel);
        container.appendChild(maxPlanetsLog2Stepper);
        container.appendChild(maxPlanetsValue);
        container.appendChild(levelLabelFromMin);
        container.appendChild(levelFromMin);
        container.appendChild(levelLabelFromMax);
        container.appendChild(levelFromMax);
        container.appendChild(globalButton);

        // 添加MAX输入框
        let maxCaptureLabel = document.createElement('label');
        maxCaptureLabel.innerText = 'MAX';
        maxCaptureLabel.style.display = 'block';
        maxCaptureLabel.style.marginTop = '10px';

        let maxCaptureInput = document.createElement('input');
        maxCaptureInput.type = 'number';
        maxCaptureInput.min = '1';
        maxCaptureInput.value = `${this.maxCaptureCount}`;
        maxCaptureInput.style.width = '100%';
        maxCaptureInput.style.marginBottom = '10px';
        maxCaptureInput.style.background = 'rgb(8,8,8)';
        maxCaptureInput.style.color = 'white';

        maxCaptureInput.onchange = (evt) => {
            try {
                this.maxCaptureCount = Math.max(1, parseInt(evt.target.value, 10));
                evt.target.value = this.maxCaptureCount;
            } catch (e) {
                console.error('could not parse max capture count', e);
            }
        }

        // 添加自动执行checkbox
        let autoExecuteLabel = document.createElement('label');
        autoExecuteLabel.style.display = 'block';
        autoExecuteLabel.style.marginTop = '10px';
        
        let autoExecuteCheckbox = document.createElement('input');
        autoExecuteCheckbox.type = 'checkbox';
        autoExecuteCheckbox.style.marginRight = '10px';
        
        let autoExecuteSpan = document.createElement('span');
        autoExecuteSpan.innerText = 'Auto execute every 30s';
        
        autoExecuteLabel.appendChild(autoExecuteCheckbox);
        autoExecuteLabel.appendChild(autoExecuteSpan);

        // 自动执行的interval ID
        let autoExecuteInterval = null;

        autoExecuteCheckbox.onchange = (evt) => {
            if (evt.target.checked) {
                // 立即执行一次
                globalButton.click();
                // 设置30秒定时器
                autoExecuteInterval = setInterval(() => {
                    globalButton.click();
                }, 30000);
            } else {
                // 取消定时器
                if (autoExecuteInterval) {
                    clearInterval(autoExecuteInterval);
                    autoExecuteInterval = null;
                }
            }
        }

        container.appendChild(maxCaptureLabel);
        container.appendChild(maxCaptureInput);
        container.appendChild(autoExecuteLabel);
        container.appendChild(message);

        // 在组件卸载时清理interval
        return {
            destroy: () => {
                if (autoExecuteInterval) {
                    clearInterval(autoExecuteInterval);
                    autoExecuteInterval = null;
                }
            }
        };
    }
}

export default Plugin;


function capturePlanets(fromId, minCaptureLevel, maxCaptureLevel, maxDistributeEnergyPercent, planetType, minimumEnergyAllowed = 0, maxCaptureCount = 10) {
    const planet = df.getPlanetWithId(fromId);
    const from = df.getPlanetWithId(fromId);

    // Rejected if has pending outbound moves
    const unconfirmed = df.getUnconfirmedMoves().filter(move => move.from === fromId)
    if (unconfirmed.length !== 0) {
        return 0;
    }

    const candidates_ = df.getPlanetsInRange(fromId, maxDistributeEnergyPercent)
        .filter(p => (
            p.owner !== df.account &&
            players.includes(p.owner) &&
            p.planetLevel >= minCaptureLevel &&
            p.planetLevel <= maxCaptureLevel &&
            p.planetType === planetType
        ))
        .map(to => {
            return [to, distance(from, to)]
        })
        .sort((a, b) => a[1] - b[1]);

    let i = 0;
    const energyBudget = Math.floor((maxDistributeEnergyPercent / 100) * planet.energy);

    let energySpent = 0;
    let moves = 0;
    while (energyBudget - energySpent > 0 && i < candidates_.length && moves < maxCaptureCount) {

        const energyLeft = energyBudget - energySpent;

        // Remember its a tuple of candidates and their distance
        const candidate = candidates_[i++][0];

        // Rejected if has unconfirmed pending arrivals
        const unconfirmed = df.getUnconfirmedMoves().filter(move => move.to === candidate.locationId)
        if (unconfirmed.length !== 0) {
            continue;
        }

        // 获取所有前往该行星的舰队
        const arrivals = getArrivalsForPlanet(candidate.locationId);
        
        // 计算该行星需要的能量
        const energyForCandidate = minimumEnergyAllowed === 0 ? 1 : candidate.energyCap * minimumEnergyAllowed / 100;
        const energyNeededToCapture = energyForCandidate + (candidate.energy * (candidate.defense / 100));
        
        // 计算已有舰队携带的能量总和
        let incomingEnergy = 0;
        let alreadyBeingCaptured = false;
        
        // 检查所有正在前往的舰队
        if (arrivals.length > 0) {
            for (const arrival of arrivals) {
                // 只计算我方舰队的能量
                if (arrival.fromPlanet && df.getPlanetWithId(arrival.fromPlanet).owner === df.account) {
                    incomingEnergy += arrival.energyArriving;
                    
                    // 如果已有舰队能量足够占领，则跳过该行星
                    if (incomingEnergy >= energyNeededToCapture) {
                        alreadyBeingCaptured = true;
                        break;
                    }
                }
            }
            
            // 如果已经有足够能量前往攻击，跳过这个目标
            if (alreadyBeingCaptured) {
                continue;
            }
            
            // 如果有敌方舰队，也跳过这个目标
            const hasEnemyArrivals = arrivals.some(arrival => {
                const fromPlanet = arrival.fromPlanet ? df.getPlanetWithId(arrival.fromPlanet) : null;
                return fromPlanet && fromPlanet.owner !== df.account;
            });
            
            if (hasEnemyArrivals) {
                continue;
            }
        }

        // 计算还需要的额外能量
        let energyStillNeeded = energyNeededToCapture - incomingEnergy;
        if (energyStillNeeded <= 0) {
            continue; // 已经有足够的能量前往
        }
        
        // 计算从当前行星发送所需的能量
        const energyNeeded = Math.ceil(df.getEnergyNeededForMove(fromId, candidate.locationId, energyStillNeeded));
        if (energyLeft - energyNeeded < 0) {
            continue;
        }

        df.move(fromId, candidate.locationId, energyNeeded, 0);
        energySpent += energyNeeded;
        moves += 1;
    }

    return moves;
}

function getArrivalsForPlanet(planetId) {
    return df.getAllVoyages().filter(arrival => arrival.toPlanet === planetId).filter(p => p.arrivalTime > Date.now() / 1000);
}

//returns tuples of [planet,distance]
function distance(from, to) {
    let fromloc = from.location;
    let toloc = to.location;
    return Math.sqrt((fromloc.coords.x - toloc.coords.x) ** 2 + (fromloc.coords.y - toloc.coords.y) ** 2);
}